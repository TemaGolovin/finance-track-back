# Техдолг бэкенда

Рефакторинг NestJS + Prisma в репозитории `finance-track-back`. Продуктовый бэклог (стенд, UX, безопасность, деплой): [ROADMAP.md](../../finance-track-front/docs/ROADMAP.md). Закрытое: [DONE.md](../../finance-track-front/docs/DONE.md).

Часть тем пересекается с таблицами **«Критично перед тестовым деплоем»** и **«Безопасность»** в ROADMAP — там приоритет перед выкладкой; здесь — детальный план правок в коде API.

Не ломает стенд само по себе, но мешает расширять API и даёт несколько экземпляров одних и тех же сервисов.

### NestJS: модули, импорты и экспорты

**Что:** Провайдеры соседних модулей не копировать в `providers`. Модуль экспортирует свои сервисы, потребитель подключает их через `imports`.

**Сейчас:** `CategoryService` и `CategoryRepository` заново зарегистрированы в `providers` у `AuthModule`, `OperationModule`, `UserGroupModule`, `UserModule`. `UserModule` так же дублирует `UserGroupService` / `UserGroupRepository`. `CategoryModule` свои провайдеры **не экспортирует**.

NestJS создаёт **отдельный экземпляр** на каждый модуль, где класс указан в `providers`. Это обход экспорта/импорта: не общий singleton из DI, а дополнительные копии модуля.

**Образцы, как должно быть:** `MailModule`, `EmailTokenModule`, `PrismaModule`, `UserGroupModule` — `exports` + `imports` у потребителя.

**Сделать:**

1. `CategoryModule`: `exports: [CategoryService, CategoryRepository]`.
2. Убрать `Category*` из `providers` чужих модулей; вместо этого `imports: [CategoryModule]`.
3. `UserModule`: импортировать `UserGroupModule`, не дублировать его провайдеры.
4. Проверить `@Global()` на `AppModule`: без `exports` он ничего не даёт. Глобальность оставить только там, где нужна (как у `PrismaModule`).
5. Пройти остальные модули: чужие классы только через `imports`/`exports`.

**Критерий:** один экземпляр каждого сервиса в DI; зависимости между доменами только через модульный контракт. Сложность: S.

### NestJS: жизненный цикл запроса (middleware → guards → pipes → interceptors → filters)

Заметки с разбора текущего API. Не ломает стенд само по себе; трогать пакетом, когда будете выравнивать HTTP-слой. Порядок слоёв и назначение — [Request lifecycle](https://docs.nestjs.com/faq/request-lifecycle).

**Как сейчас (в общих чертах):**


| Слой              | В проекте                                                                             |
| ----------------- | ------------------------------------------------------------------------------------- |
| Middleware        | CORS, `cookie-parser`, i18n (`Accept-Language`)                                       |
| Guards            | Глобальный `JwtAuthGuard` + `@Public()`; на refresh — отдельный `JwtAuthRefreshGuard` |
| Pipes             | Глобальный `ValidationPipe` (i18n factory); `ParseUUIDPipe` точечно                   |
| Interceptors      | Нет                                                                                   |
| Exception filters | Только `SafeI18nValidationExceptionFilter` (ошибки валидации)                         |


Auth в guard, DTO в pipe, user из `request.user` через `@UserInfo()`, ACL «создатель группы» в сервисе — это оставлять. Не переносить валидацию в guard и авторизацию в interceptor.

Часть пунктов уже в таблицах выше: refresh-cookie, `COOKIE_SECURE`, `ValidationPipe` whitelist. Ниже — остальной HTTP-техдолг.

**Сделать (когда дойдёте до рефакторинга HTTP):**

1. **Cookie и** `@Res()`**.** Login/refresh/logout/profile сами пишут ответ через `@Res()`. Из‑за этого будущие interceptors на этих маршрутах не сработают. Вынести set/clear cookie из контроллера (`passthrough: true` или interceptor); не дублировать один и тот же `response.cookie(...)`.
2. **Interceptors — по необходимости, не «чтобы были».** Имеет смысл, если появится сквозная задача: access-log + duration, единый `{ success, data }` (сейчас `ResponseWrapper` только в auth, остальной API отдаёт сущность как есть), кэш тяжёлых GET (`/operation`, `/category/stat`, group stat). Глобальная обёртка ответа — ломающий контракт для фронта, только после согласования.
3. **Pipes жёстче и ровнее.** `whitelist` / `transform` (уже в блоке безопасности). Добить DTO: `color`/`icon` у категории, query `type` у `GET /category` (сейчас голый тип, не DTO), `categoryId` в фильтрах. Пустой `name` в `GET /user/find/by-name` — через pipe, не `if` в контроллере.
4. `ParseUUIDPipe` **системно** на `:id` / `:groupId` / `:memberId`, не только на `DELETE /auth/sessions/:deviceId`. Иначе мусор в path уходит в Prisma как 500.
5. **Guard чуть каноничнее.** `@Public()` через `Reflector.getAllAndOverride` (класс + метод). Глобальный guard лучше как `APP_GUARD` в модуле, а не `new JwtAuthGuard(reflector)` в `main.ts` (так уже сделано в e2e). `canActivate` у Passport возвращает Promise/Observable — не кастить в `boolean`.
6. **Единый JSON ошибок.** Сейчас filter ловит только i18n-валидацию; `NotFound` / `Forbidden` из сервисов идут дефолтным Nest-фильтром. `TemplateErrorResponse` в Swagger есть, общего контракта — нет. Глобальный `HttpException` filter, когда выровняете ответы. Утечку `value` и `target` (пароль в теле 400) чинить сразу в `SafeI18nValidationExceptionFilter`, не ждать общего контракта — пункт в блоке «Безопасность».

**Не делать:** RolesGuard ради «только создатель группы» — это resource ACL с запросом в БД, ему место в сервисе.

**Критерий:** cookie не парсятся руками; контроллеры не держат Express `Response` без нужды; UUID и query валидируются pipe’ом; ошибки одного формата. Interceptor — только если есть реальное сквозное поведение. Сложность: S–M.

### Уникальный индекс: 500 вместо ConflictException

**Сейчас:** занятый email, имя или название категории сервис ловит заранее (`findUnique` / аналог) и бросает `ConflictException` — клиент получает **409** и строку из `errors.ALREADY_EXISTS`. Сама запись (`create` / `update`) ошибку уникального индекса не ловит.

**Что не так:** два запроса проходят проверку одновременно, второй упирается в `@unique` / `@@unique`. Это исключение Prisma, не класс Nest. Клиент получает **500** `Internal server error`, хотя по смыслу это тот же конфликт. `$transaction` вокруг записи это не меняет: индекс всё равно бросает исключение.

**Где:** `AuthService.registration` (email и name), смена имени в `AuthService`, `CategoryService.createCategory` / `updateCategory`, смена email в `UserService` (`requestEmailChange`, `confirmEmailChange`).

**Сделать:** в этих местах поймать нарушение уникального индекса и бросить тот же `ConflictException`, что уже бросает проверка до записи. Текст `message` оставить из `errors.ALREADY_EXISTS`.

**Не делать:** общий фильтр, который кладёт в ответ `message` исключения Prisma. Неожиданный сбой базы должен по-прежнему уходить как 500 `Internal server error`.

**Критерий:** повторная регистрация с тем же email в гонке отвечает 409, не 500; обычная ошибка Prisma по-прежнему не светит текст базы. Сложность: S.

### Валидация и DTO: граница доверия

Разбор: **синтаксис** (глобальный `ValidationPipe` + `class-validator` на DTO) vs **смысл** (сервис: владение категорией, членство в группе). `@ApiProperty` — только Swagger, на pipe не влияет.

Часть уже выше: `ValidationPipe` whitelist (блок «Безопасность»), `ParseUUIDPipe` и добивка DTO (подраздел «жизненный цикл»). Ниже — дыры, которые **пропускают мусор на первой границе** или **обходят вложенную валидацию**.


| Приоритет | Задача                                            | Что не так                                                                                                                                                                                             | Где                                                |
| --------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| Высокий   | **ConnectGroupCategoryDto без nested validation** | `relatedCategories` — массив без `@ValidateNested({ each: true })` и `@Type(() => RelatedCategory)`. Декораторы на вложенном классе **не применяются**; невалидные UUID в элементах проходят pipe.     | `src/user-group/dto/connect-group-category.dto.ts` |
| Средний   | **color / icon в CreateCategoryDto**              | Поля только с `@ApiProperty`, без `@IsString()` (и без проверки формата hex у color). Любой тип в body доходит до сервиса и Prisma.                                                                    | `src/category/dto/create-category.dto.ts`          |
| Средний   | **categoryId в GetOperationDto**                  | Опциональный фильтр без `@IsUUID()`. Строка `"abc"` проходит pipe и уходит в репозиторий.                                                                                                              | `src/operation/dto/get-operation.dto.ts`           |
| Средний   | **ParseUUIDPipe на path-параметрах**              | `@Param('id')` как `string` в operation, category, user-group. Мусор в URL не отсекается на входе — ошибка всплывает позже (404/500). Сейчас pipe точечно только на `DELETE /auth/sessions/:deviceId`. | `*.controller.ts`                                  |
| Низкий    | **ValidationPipe whitelist**                      | Extra-поля в body не отсекаются; контракт DTO размыт (Prisma отрежет неизвестные при записи, но `...spread` в сервисе опаснее). Уже в блоке «Безопасность».                                            | `src/main.ts`                                      |


**Сделать:**

1. **ConnectGroupCategoryDto:** `@ValidateNested({ each: true })` + `@Type(() => RelatedCategory)` на `relatedCategories`. E2e: массив с невалидным UUID → 400 до сервиса.
2. **CreateCategoryDto:** `@IsString()` на `color` и `icon`; при необходимости `@Matches` для hex у color. Согласовать с `UpdateCategoryDto` (там color/icon пока нет — см. «критично перед тестовым деплоем»).
3. **GetOperationDto.categoryId:** `@IsUUID()` + `@IsOptional()`.
4. **ValidationPipe:** `whitelist: true`, `forbidNonWhitelisted: true` (или только whitelist) — вместе с п.3 из подраздела «жизненный цикл».
5. **ParseUUIDPipe** системно на `:id`, `:groupId`, `:categoryId`, `:memberId` — вместе с п.4 из подраздела «жизненный цикл».

**Не путать с доменной валидацией:** «категория существует и принадлежит userId» — задача сервиса (`requireCategoryForUser`), не DTO. DTO не должен дублировать ACL.

**Критерий:** вложенные объекты в body валидируются pipe’ом; опциональные UUID в query — либо валидный UUID, либо отсутствуют; мусор в path → 400, не необработанная ошибка Prisma; лишние поля body не доходят до handler. Сложность: S.

### Авторизация: JWT, cookies, refresh, logout

Разбор текущей схемы: пара access (15м, stateless) / refresh (7д, строка в `RefreshToken`), оба в httpOnly cookies, BFF перекладывает access в `Authorization: Bearer`. Ниже — недостатки. Три пункта уже в «критично перед тестовым деплоем» (secure, парсинг Cookie, сверка хеша) — здесь полный список, чтобы не потерять при рефакторинге `src/auth/`.

**Сделать:**

1. **Сверка refresh с хешем и reuse detection.** В БД пишется bcrypt-хеш, при `refresh` он **не сравнивается**: достаточно валидного JWT и строки `userId`+`deviceId`. После ротации старый refresh всё ещё проходит. Сверять `compare(cookie, row.token)`; при несовпадении — считать reuse и отзывать сессию устройства (или все сессии пользователя). Уже в таблице критично; без этого ротация фиктивная.
2. **Парсинг Cookie для refresh.** Хрупкий `split('=')` в `refresh-jwt.strategy.ts`. Заменить на `req.cookies` (`cookie-parser` уже подключён). Уже в таблице критично.
3. `**secure` / `maxAge` / `path` cookies.** `secure: false` зашит; у `setCookie` нет `maxAge` (JWT 15м/7д, cookie — сессионная); refresh с `path: '/'` уходит на все пути, не только на `/auth/refresh`. Вынести опции в одно место; `COOKIE_SECURE` из env; `maxAge` согласовать с TTL; refresh сузить path, если BFF это позволяет. `clearCookie` вызывать с теми же `path` / `sameSite` / `secure`, иначе в части браузеров cookie не снимется.
4. **Access в JSON.** Login / registration / refresh / profile отдают `token` в теле и дублируют его httpOnly cookie. XSS не читает cookie, но видит JSON. Не отдавать access в body, раз клиент его не сохраняет (BFF уже берёт новый access из refresh JSON только на сервере). Уже в блоке безопасности как низкий — при рефакторинге auth поднять приоритет.
5. **Логаут не убивает access.** `logout` (и revoke сессии) удаляет refresh и чистит cookies. Access stateless: украденный/скопированный JWT живёт до `exp` (~15м). Это ограничение схемы, не баг само по себе. Если нужно «выйти везде сразу» для access — denylist/`jti` или укоротить TTL ещё сильнее; иначе явно зафиксировать как принятый риск.
6. **Смена пароля не сбрасывает сессии.** `resetPassword` удаляет все refresh пользователя; `changePassword` только пишет новый хеш пароля. Чужие устройства остаются в системе. После смены пароля из профиля — как минимум удалить refresh **других** `deviceId` (текущий можно ротировать).
7. **Один набор cookie-опций.** Сейчас `response.cookie(...)` скопирован в login / registration / refresh / profile. Вынести (хелпер или interceptor) — пересекается с п.1 HTTP-слоя про `@Res()`.

**Не путать с продуктовым бэклогом:** OAuth / Passkeys — раздел «Другие способы авторизации». Rate limiting на login — блок «Безопасность».

**Критерий:** refresh принимается только если JWT валиден **и** хеш в БД совпал; повторно использованный refresh не выдаёт новую пару; cookies с предсказуемыми `secure`/`maxAge`/`path`; access не светится в JSON клиенту; смена пароля отзывает чужие сессии. Сложность: S–M.

### Группы: личные категории, групповые и `PersonalCategoryMap`

Операции всегда личные (`userId` + `Category`). Группа не хранит свои траты: список и статистика — join через `PersonalCategoryMap` («моя личная категория в этой группе = эта `GroupCategory`»). Модель верная для семейного rollup; ниже — дыры вокруг неё, не повод переписывать на `Operation.groupId`.

**Сейчас:** при создании группы все личные категории создателя копируются в `GroupCategory` и сразу мапятся 1:1. Новый участник без экрана connect в статистике не участвует (`defaultKey` — только автоподсказка на фронте). Unique: `(groupCategoryId, userId)` и `(groupId, categoryId, userId)`. `groupId` в мапе денормализован (дубль `GroupCategory.groupId`).


| Приоритет | Задача                                     | Что не так                                                                                                                                                                                                                                                                   | Где                                                                                            |
| --------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| ~~Высокий~~ | ~~**Тип категории при connect**~~          | Сделано: проверка `categoryType` в `connectGroupCategoriesToPersonalCategories`.                                                                                                                                                                                             | `UserGroupService.connectGroupCategoriesToPersonalCategories`                                  |
| ~~Высокий~~ | ~~**Тип операции и тип категории**~~       | Сделано: сверка при `create`/`update`; в `getUserGroupStat` операции фильтруются по типу.                                                                                                                                                                                      | `OperationService`, `UserGroupRepository.getUserGroupStat`                                     |
| Средний   | **Стата группы в Node, не в SQL**          | `getUserGroupStat` тянет все операции замапленных категорий и суммирует `Decimal` в `reduce`. При росте данных упрётесь сюда раньше, чем в схему.                                                                                                                            | `UserGroupRepository.getUserGroupStat`                                                         |
| Средний   | **Индексы под join мапы**                  | Горячий путь `GroupCategory → Map → Category → Operation`. На `Operation` нет `@@index` (список: `userId` + `type` + `operationDate`). Unique у `GroupCategory` начинается с `name` — не обслуживает `WHERE groupId`. У членства нет unique `(userId, userRelationGroupId)`. | `schema.prisma`, `operation.repository.ts`                                                     |
| Низкий    | **Инвариант `map.groupId`**                | Колонка нужна для unique и каскада, но «`map.groupId === groupCategory.groupId`» держит только код записи, не CHECK в БД.                                                                                                                                                    | `PersonalCategoryMap`, `connectGroupCategoriesToPersonalCategories`                            |


**Сделать:**

1. ~~**Пустой фильтр.**~~ Сделано: `getUserGroupOperations`, e2e `test/user-group.e2e-spec.ts`.
2. ~~**Выход и кик.**~~ Сделано: транзакция в `removeUserFromGroup`, e2e в том же файле.
3. ~~**Совпадение типа.**~~ Сделано.
4. ~~**Тип операции.**~~ Сделано (сумма в SQL — п.5).
5. **Сумма в БД.** Статистика группы — `SUM` / `GROUP BY` по join мапы и операций (период, тип), не загрузка строк в Nest.
6. **Индексы под запросы, не «на всякий случай».** Кандидаты: `Operation (userId, type, operationDate)`; при фильтре по категории — `(userId, categoryId, operationDate)`; `GroupCategory (groupId, categoryType)`; unique на `(userId, userRelationGroupId)` у `UserRelationGroupUser` (сейчас одного человека можно добавить в группу дважды). Перед добавлением — `EXPLAIN` на `getUserGroupOperations` / личный список.
7. `**groupId` в мапе.** Либо CHECK / писать `groupId` только из `GroupCategory`, либо убрать колонку и выразить unique через связь, если Prisma это позволит без боли.

**Не делать:** переносить `groupId` на `Operation` и плодить групповой журнал. Мапа категории целиком — контракт продукта («в группе эта категория / не в группе»). Маппинг каждой операции — только если появится «часть трат в категории личная».

**Не путать с продуктовым бэклогом:** стартовый набор `GroupCategory` сейчас = дамп категорий создателя; узкий дефолтный набор (`supermarket`, `cafe`, …) — идея, не баг схемы. Предупреждение при смене `defaultKey` — уже в «Идеи развития» (влияет только на автоподсказку новичкам, сохранённые мапы живут по UUID).

**Критерий:** фильтр по групповой категории не «протекает» в полный список; вышедший участник исчезает из статы; connect и создание операции не смешивают доход/расход; стата не тащит все операции в память. Сложность: S–M (фильтр/кик/тип — S; SQL-стата и индексы — M).

### Приглашения: повтор после отказа

**Сейчас:** `Invitation` имеет `@@unique([recipientId, groupId], name: "active_invitation")`. Имя говорит «одно активное», ограничение действует на **любой** статус.

**Что не так:** после `DECLINED` или `CANCELLED` новую строку тому же человеку в ту же группу вставить нельзя — `createInvitation` падает по unique. Повторно позвать в группу невозможно, пока старая строка жива.

**Сделано:** partial unique `Invitation_recipientId_groupId_pending_key` (`WHERE status = 'PENDING'`), миграция `20260401120000_invitation_pending_unique`. E2e: повторный `POST /user/invitation` после `CANCELLED`.

**Критерий:** отклонившего можно пригласить снова; двух `PENDING` на пару (человек, группа) нет. Сложность: S.

### Транзакции: многошаговые записи без атомарности

**Сейчас:** `$transaction` есть в `deleteAccount`, `connectGroupCategoriesToPersonalCategories`, `createInitGroupCategories`, `updateOperation` / `deleteOperation`. Nested write (`createUserGroup` + первый участник) атомарен сам. Письма отправляются вне транзакций — так и должно быть.

**Что не так:** несколько бизнес-действий — это 2+ отдельных запроса через `this.prisma`. Сбой посередине оставляет промежуточное состояние в БД.


| Приоритет | Задача                     | Что не так                                                                                                                                                                                                          | Где                                                       |
| --------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Высокий   | **Регистрация**            | `user.create` → `createDefaultCategories` → email-токен → refresh — без транзакции. Упали категории — юзер в БД без категорий, клиент получил 500, повторная регистрация упирается в `checkUserExistsByEmail` → 409. | `AuthService.registration`                                |
| Высокий   | **Сброс пароля**           | Смена хеша, удаление email-токена и удаление всех refresh — три отдельных запроса. Упало последнее — пароль сменён, старые (в т.ч. украденные) сессии живы; упало удаление токена — ссылка из письма переиспользуема до TTL. | `AuthService.resetPassword`                               |
| Средний   | **Принятие приглашения**   | `addToGroup` и `updateInvitation` — отдельно. Сбой между ними: участник в группе, приглашение `PENDING`. Плюс гонка двух «принять» → дубль членства (транзакция не лечит, нужен unique — см. «Индексы под join мапы»). | `UserService` (смена статуса приглашения)                 |
| Средний   | **Создание группы**        | Группа создаётся одним запросом, `createInitGroupCategories` — своей транзакцией после. Упала вторая — группа без категорий и мапов.                                                                                | `UserGroupService.create`                                 |


**Сделать:**

1. **Регистрация:** `user.create` + `category.createMany` + `emailToken.create` + `refreshToken.create` в одном `$transaction`. Для этого репозиториям/сервисам принимать `tx` (`Prisma.TransactionClient`) вместо жёсткого `this.prisma`. Письмо — после коммита, как сейчас.
2. **Сброс пароля:** `user.update` + `emailToken.delete` + `refreshToken.deleteMany` в одной транзакции. Токен «погашать» условно (`deleteMany where id + expiresAt > now` и проверка `count`), чтобы одна ссылка не сработала дважды параллельно.
3. **Приглашение:** перевод статуса условным `updateMany where { id, status: PENDING }` → если `count === 0`, 409; добавление в группу в той же транзакции. Unique на членство — из подраздела «Группы».
4. **Создание группы:** группа + групповые категории + мапы в одной транзакции (либо nested write, либо `tx` в оба метода репозитория).
5. **Выход/кик из группы** — вместе с п.2 «Группы»: удаление членства и мапов в одной транзакции.

**Не делать:** заворачивать в транзакцию одиночные запросы и nested write — они и так атомарны. Не класть внутрь отправку писем и другие внешние побочные эффекты — их не откатить, а транзакция будет держать соединение.

**Критерий:** ни одно из действий выше не оставляет «половинное» состояние при падении любого шага; повторная регистрация после 500 возможна; после сброса пароля чужих refresh нет; двойное принятие приглашения не создаёт два членства. Сложность: S–M (нужно протащить `tx` через репозитории).

### Тесты: parity с prod, качество регрессий, CI

Разбор: unit оправдан там, где **формулы и правила** (stat, email-token, ACL creator в группе); большая часть сервисов — оркестрация CRUD, её достаточно ловить **e2e** с реальной БД. Риск для «боевого» использования не в «мало spec на каждый метод», а в том, что e2e **не повторяют** `main.ts` и часть негативных unit **молча зелёные**.

**Сейчас:** три unit-файла (`category.service.spec`, `user-group.service.spec`, `email-token.service.spec`); пять e2e (`test/*.e2e-spec.ts`). В category/operation/user/user-group e2e подменяют `APP_GUARD` и кладут `req.user` — JWT не проверяется. E2e поднимают `AppModule` без глобальных `ValidationPipe` и `JwtAuthGuard` из `main.ts`. `auth.e2e` покрывает публичные флоу, но не `me` / `logout` / `change-password` / `sessions` / `delete-account`. Негативные кейсы в `user-group.service.spec` — `try/catch` без `rejects` (если исключения нет, тест проходит). CI с прогоном тестов в репозитории бэка нет.


| Приоритет | Задача | Что не так | Где |
| --------- | ------ | ---------- | --- |
| Высокий | **Общий bootstrap приложения для e2e и prod** | Pipe, guard, `cookie-parser` живут только в `main.ts`; e2e их не подключают — валидация DTO и 401 без токена в тестах не воспроизводятся. | `src/main.ts` → вынести `configureApp(app)`; все `test/*.e2e-spec.ts` |
| Высокий | **E2e: реальный JWT на защищённых роутах** | Mock `APP_GUARD` обходит Passport и refresh/access схему. Нужны сценарии: после login cookie/Authorization → 200; без auth → 401; чужой ресурс → 404/403 как в prod. | `test/category.e2e-spec.ts`, `operation`, `user`, `user-group`; убрать fake guard после bootstrap |
| Высокий | **Auth e2e: защищённые эндпоинты** | Логика refresh/logout/sessions в `AuthService` без автоматической страховки. | `test/auth.e2e-spec.ts` — `GET /auth/me`, `POST /auth/logout`, `change-password`, `sessions`, `delete-account` |
| Высокий | **Негативные unit: `rejects`, не `try/catch`** | Регресс (например сняли проверку участника группы) может не упасть. | `src/user-group/user-group.service.spec.ts`; пройти остальные spec |
| Средний | **E2e на границу валидации** | После `configureApp` — 400 на кривой body/query (nested DTO connect, невалидный UUID в query), без утечки пароля в теле (см. «Безопасность»). | `test/` + DTO из блока «Валидация и DTO» |
| Средний | **CI: unit + e2e на PR/merge** | Регрессии ловятся только локально. Postgres в job (service container или compose), env из секретов/`setup-env.js`. | `.github/workflows/` в `finance-track-back` |
| Низкий | **Unit на `getOperations` (группировка по дате)** | Логика как у stat, но без spec; e2e не проверяет несколько дат в одном ответе. | `src/operation/operation.service.ts` |
| Низкий | **Unit на `updateInvitation` (переходы статусов)** | State machine в сервисе; частично косвенно в user e2e, без матрицы переходов. | `src/user/user.service.ts` |


**Сделать:**

1. **`configureApp(app)`** (или аналог): `ValidationPipe` + i18n factory, глобальный `JwtAuthGuard` через `APP_GUARD` + `Reflector` (см. техдолг HTTP — guard из модуля, не `new` в `main.ts`), `cookie-parser`, CORS при необходимости. `main.ts` и каждый e2e вызывают одну функцию после `createNestApplication()`.
2. **Переписать e2e category/operation/user/user-group:** убрать подмену `APP_GUARD`; пользователь из реального login или helper «register + cookies»; минимум один тест «без cookie → 401» на защищённый GET.
3. **Расширить `auth.e2e-spec.ts`:** цепочка login → `me` → logout; смена пароля и отзыв сессии (когда закрыт пункт про refresh-хеш в «Авторизация»).
4. **Unit:** заменить `try/catch` на `await expect(...).rejects...` во всех негативных кейсах; при добавлении новых unit — только формулы/правила, не «каждый `if (!existing)`».
5. **Workflow:** `pnpm test` + `pnpm test:e2e` (или npm), миграции Prisma перед e2e; падение job = блок merge (если используете PR).

**Не делать:** гоняться за покрытием `%` по всему `src` (`test:cov` на thin CRUD мало что даёт); дублировать e2e и unit для одного и того же «409 если имя занято»; unit на репозитории без отдельной цели — SQL проще держать e2e-сценарием + `EXPLAIN`, когда трогаете запросы (см. «Группы»).

**Критерий:** e2e и prod используют один HTTP-bootstrap; защищённый роут без JWT даёт 401 в тесте; auth-защищённые маршруты покрыты сквозняком; негативный unit падает, если сервис перестал кидать исключение; CI стабильно гоняет оба набора. Сложность: S–M (bootstrap + правка e2e — S; CI + auth matrix — M).

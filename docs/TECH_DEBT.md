# Техдолг бэкенда

Рефакторинг NestJS + Prisma в репозитории `finance-track-back`. Продуктовый бэклог (стенд, UX, безопасность, деплой): [ROADMAP.md](../../finance-track-front/docs/ROADMAP.md). Закрытое: [DONE.md](../../finance-track-front/docs/DONE.md).

Часть тем пересекается с таблицами **«Критично перед тестовым деплоем»** и **«Безопасность»** в ROADMAP — там приоритет перед выкладкой; здесь — детальный план правок в коде API.

Не ломает стенд само по себе, но мешает расширять API и даёт несколько экземпляров одних и тех же сервисов.

### ~~NestJS: модули, импорты и экспорты~~

**Сделано:** `CategoryModule` экспортирует `CategoryService` и `CategoryRepository`; `AuthModule`, `OperationModule`, `UserGroupModule` подключают его через `imports`, без дубля в `providers`. `UserModule` импортирует `UserGroupModule` вместо копирования `UserGroupService` / `UserGroupRepository` (лишние `Category`* у `UserModule` убраны — сервис их не использовал). С `@AppModule` снят пустой `@Global()`; глобальным остаётся только `PrismaModule` с `exports`.

### ~~NestJS: жизненный цикл запроса (middleware → guards → pipes → interceptors → filters)~~

**Сделано:** `configureApp()` (`ValidationPipe` с `whitelist` / `forbidNonWhitelisted` / `transform`, `cookie-parser`) — общий bootstrap для `main.ts` и e2e. Глобальный `JwtAuthGuard` через `APP_GUARD` + `useExisting`; `@Public()` — `Reflector.getAllAndOverride`; `canActivate` без каста в `boolean`. Auth: `@Res({ passthrough: true })`, cookies в `setAuthSessionCookies` / `clearAuthSessionCookies`. DTO: `GetCategoriesDto`, `FindUsersByNameQueryDto`, `GetUserGroupOperationsDto`, nested validation в `ConnectGroupCategoryDto`, `color`/`icon`/`categoryId` в query. `ParseUUIDPipe` на path `:id` / `:groupId` / `:memberId` / `:categoryId` / `:deviceId`. В `SafeI18nValidationExceptionFilter` — без утечки `value`/`target` в `error`.

**Остаётся (по необходимости):**

1. **Interceptors** — только под сквозную задачу (access-log, единая обёртка ответа после согласования с фронтом, кэш тяжёлых GET).
2. **Единый JSON ошибок** для `HttpException` (`NotFound` / `Forbidden`) — глобальный filter, когда выровняете контракт с `TemplateErrorResponse`.

### ~~Уникальный индекс: 500 вместо ConflictException~~

**Сделано:** P2002 на `create`/`update` в `AuthService.registration`, `AuthService.updateProfile`, `CategoryService.createCategory` / `updateCategory`, `UserService.confirmEmailChange` → тот же `ConflictException` с `errors.ALREADY_EXISTS`. Хелпер `src/prisma/unique-constraint-violation.ts`; без глобального Prisma-фильтра.

### ~~Валидация и DTO: граница доверия~~

**Сделано:** глобальный `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`) в `configureApp`. `ConnectGroupCategoryDto.relatedCategories` — `@ValidateNested({ each: true })` + `@Type(() => RelatedCategory)`; e2e: невалидный UUID в элементе → 400. `CreateCategoryDto`: `@IsString()` на `color` и `icon`, `@Matches` для hex; те же поля есть в `UpdateCategoryDto`. `GetOperationDto.categoryId` — `@IsUUID()` + `@IsOptional()`. `ParseUUIDPipe` на path `:id` / `:groupId` / `:memberId` / `:categoryId` / `:deviceId`.

Доменная проверка «категория существует и принадлежит userId» остаётся в сервисе (`requireCategoryForUser`), не в DTO.

### ~~Авторизация: JWT, cookies, refresh, logout~~

Схема: access (15м, stateless) / refresh (7д, строка в `RefreshToken`), оба в httpOnly cookies. BFF читает их на `/api/*` и кладёт access в `Authorization: Bearer`.

**Сделано:** сверка refresh с хешем (`refreshTokenMatchesStorage`: SHA-256 digest и legacy bcrypt от полного JWT) и reuse — несовпадение отзывает сессию устройства; e2e `rejects reused refresh token`. Refresh берётся из `req.cookies.refreshToken`. Опции кук в одном месте: `getAccessTokenCookieOptions`, `getRefreshTokenCookieOptions`, `setAuthSessionCookies`, `clearAuthSessionCookies`; `secure` из `COOKIE_SECURE` или `NODE_ENV=production`; `clearCookie` с теми же path / httpOnly / sameSite / secure, без `maxAge` (иначе `Max-Age` перебивает истечение). `path: '/'` оставлен сознательно: BFF читает refresh на всех `/api/*`, узкий path cookie до BFF не доедет. Access и refresh не отдаются в JSON (`omitAuthTokensFromBody`); BFF забирает новый access из `Set-Cookie`. `maxAge` access и refresh совпадает с TTL JWT (`JWT_ACCESS_EXPIRES_IN`, по умолчанию `15m`, и `7d`); тот же TTL у `expiresIn` refresh и `RefreshToken.expiresAt`. `changePassword` в одной транзакции пишет новый хеш и удаляет refresh других `deviceId`; текущая сессия остаётся. Логаут и revoke удаляют refresh и чистят cookies. Access stateless и живёт до `exp` (~15м) — принятый риск схемы, denylist / `jti` не делаем, пока не понадобится мгновенный отзыв access. `resetPassword` удаляет все refresh в одной транзакции со сменой пароля.

**Не путать с продуктовым бэклогом:** OAuth / Passkeys — раздел «Другие способы авторизации». Rate limiting на login уже есть.

### ~~Группы: личные категории, групповые и `PersonalCategoryMap`~~

**Сделано:** операции остаются личными, группа собирает их через `PersonalCategoryMap`. Connect и создание операции сверяют доход/расход; пустой фильтр групповой категории не отдаёт весь список; выход и кик удаляют мапы в одной транзакции (`removeUserFromGroup`). Стата группы — `SUM` / `GROUP BY` в `UserGroupRepository.getUserGroupStat`, доли считаются в сервисе. Индексы: `Operation (userId, type, operationDate)`, `Operation (categoryId, type, operationDate)`, `GroupCategory (groupId, categoryType)`, unique членства `(userId, userRelationGroupId)`. Составной FK `(groupCategoryId, groupId)` → `GroupCategory (id, groupId)`; вложенная запись мапы не задаёт свой `groupId`. E2e: `test/user-group.e2e-spec.ts`.

`groupId` на `Operation` не переносить: в группе категория целиком. Узкий стартовый набор `GroupCategory` (`supermarket`, `cafe`, …) — идея бэклога, не дыра схемы.

### ~~Приглашения: повтор после отказа~~

**Сделано:** partial unique `Invitation_recipientId_groupId_pending_key` (`WHERE status = 'PENDING'`), миграция `20260401120000_invitation_pending_unique`. Повторный `POST /user/invitation` после `CANCELLED` и `DECLINED` — 201. Второй `PENDING` на ту же пару — `ConflictException` (`errors.ALREADY_EXISTS`), не 500. E2e: `test/user.e2e-spec.ts`.

### Транзакции: многошаговые записи без атомарности

**Сейчас:** `$transaction` есть в `deleteAccount`, `registration`, `resetPassword`, `connectGroupCategoriesToPersonalCategories`, `createInitGroupCategories`, `updateOperation` / `deleteOperation`. Nested write (`createUserGroup` + первый участник) атомарен сам. Письма отправляются вне транзакций — так и должно быть.

**Что не так:** несколько бизнес-действий — это 2+ отдельных запроса через `this.prisma`. Сбой посередине оставляет промежуточное состояние в БД.

| Приоритет | Задача                     | Что не так                                                                                                                                                                                                          | Где                                                       |
| --------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| ~~Высокий~~ | ~~**Регистрация**~~        | Сделано: user, категории, email-токен и refresh в одном `$transaction`; письмо после коммита. | `AuthService.registration`                                |
| ~~Высокий~~ | ~~**Сброс пароля**~~       | Сделано: хеш, условное погашение токена (`count === 0` → откат) и удаление refresh — одна транзакция. | `AuthService.resetPassword`                               |
| Средний   | **Принятие приглашения**   | `addToGroup` и `updateInvitation` — отдельно. Сбой между ними: участник в группе, приглашение `PENDING`. Unique `(userId, userRelationGroupId)` уже есть: второй «принять» дубль не создаёт, но P2002 из `addToGroup` не перехватывается и клиент получает 500. | `UserService.updateInvitation`                            |
| Средний   | **Создание группы**        | Группа создаётся одним запросом, `createInitGroupCategories` — своей транзакцией после. Упала вторая — группа без категорий и мапов.                                                                                | `UserGroupService.create`                                 |

**Сделать:**

1. ~~**Регистрация.**~~ Сделано: `user.create`, категории по умолчанию, email-токен и refresh в одном `$transaction`; письмо после коммита.
2. ~~**Сброс пароля.**~~ Сделано: смена хеша, условное погашение токена (`deleteMany`, `count === 0` → откат) и удаление refresh в одной транзакции.
3. **Приглашение:** unique на членство уже есть. Статус и `addToGroup` — в одной транзакции. Статус переводить условным `updateMany where { id, status: PENDING }`: `count === 0` → 409. P2002 на членстве тоже отдавать как 409, не 500.
4. **Создание группы:** группа + групповые категории + мапы в одной транзакции (либо nested write, либо `tx` в оба метода репозитория).
5. ~~**Выход/кик из группы.**~~ Сделано: членство и мапы удаляются в одной транзакции (`removeUserFromGroup`).

**Не делать:** заворачивать в транзакцию одиночные запросы и nested write — они и так атомарны. Не класть внутрь отправку писем и другие внешние побочные эффекты — их не откатить, а транзакция будет держать соединение.

**Критерий:** ни одно из действий выше не оставляет «половинное» состояние при падении любого шага; повторная регистрация после 500 возможна; после сброса пароля чужих refresh нет; двойное принятие приглашения отвечает 409 и не оставляет приглашение `PENDING` при уже добавленном участнике. Сложность: S–M (нужно протащить `tx` через репозитории).

### Тесты: parity с prod, качество регрессий, CI

Разбор: unit оправдан там, где **формулы и правила** (stat, email-token, ACL creator в группе); большая часть сервисов — оркестрация CRUD, её достаточно ловить **e2e** с реальной БД. HTTP-bootstrap у e2e и prod уже общий. Остаточный риск: часть e2e подменяет JWT-guard, и два негативных unit на stat молча зелёные, если исключение не брошено.

**Сейчас:** три unit-файла (`category.service.spec`, `user-group.service.spec`, `email-token.service.spec`). E2e идут через `createConfiguredE2eApp` (`configureApp`: pipe и `cookie-parser`). В category/operation/user/user-group e2e подменяют `JwtAuthGuard` и кладут `req.user` — JWT не проверяется. `auth.e2e` покрывает публичные флоу и reuse refresh, но не `me` / `logout` / `change-password` / `sessions` / `delete-account`. Негативные кейсы `getUserGroupStat` в `user-group.service.spec` — `try/catch` без `rejects` (если исключения нет, тест проходит). CI с прогоном тестов в репозитории бэка нет.

| Приоритет   | Задача                                                 | Что не так                                                                                                                                                | Где                                                                                                            |
| ----------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| ~~Высокий~~ | ~~**Общий bootstrap приложения для e2e и prod**~~      | Сделано: `configureApp` в `src/config/configure-app.ts`, e2e — `test/e2e-app.ts`. Guard — `APP_GUARD` + `useExisting` в `AuthModule`.                     | `src/main.ts`, `test/e2e-app.ts`                                                                               |
| Высокий     | **E2e: реальный JWT на защищённых роутах**             | Подмена `JwtAuthGuard` обходит Passport. Нужны сценарии: после login cookie → 200; без auth → 401; чужой ресурс → 404/403 как в prod.                     | `test/category.e2e-spec.ts`, `operation`, `user`, `user-group`                                                 |
| Высокий     | **Auth e2e: защищённые эндпоинты**                     | Публичные флоу и reuse refresh покрыты. Нет сквозняка по защищённым маршрутам.                                                                            | `test/auth.e2e-spec.ts` — `GET /auth/me`, `POST /auth/logout`, `change-password`, `sessions`, `delete-account` |
| Высокий     | **Негативные unit:** `rejects`**, не** `try/catch`     | Регресс (например сняли проверку участника группы) может не упасть.                                                                                       | `getUserGroupStat` в `src/user-group/user-group.service.spec.ts`                                               |
| ~~Средний~~ | ~~**E2e на границу валидации**~~                       | Сделано: `test/validation-response.e2e-spec.ts` (нет `value`/`target`, пароль и email не утекают); `user-group` — невалидный nested UUID и path id → 400. | `test/`                                                                                                        |
| Средний     | **CI: unit + e2e на PR/merge**                         | Регрессии ловятся только локально. Postgres в job (service container или compose), env из секретов/`setup-env.js`.                                        | `.github/workflows/` в `finance-track-back`                                                                    |
| Низкий      | **Unit на** `getOperations` **(группировка по дате)**  | Логика как у stat, но без spec; e2e не проверяет несколько дат в одном ответе.                                                                            | `src/operation/operation.service.ts`                                                                           |
| Низкий      | **Unit на** `updateInvitation` **(переходы статусов)** | State machine в сервисе; частично косвенно в user e2e, без матрицы переходов.                                                                             | `src/user/user.service.ts`                                                                                     |

**Сделать:**

1. `configureApp(app)`~~**.**~~ Сделано.
2. **Переписать e2e category/operation/user/user-group:** убрать подмену `JwtAuthGuard`; пользователь из реального login или helper «register + cookies»; минимум один тест «без cookie → 401» на защищённый GET.
3. **Расширить** `auth.e2e-spec.ts`**:** цепочка login → `me` → logout; смена пароля и отзыв сессии.
4. **Unit:** в `getUserGroupStat` заменить `try/catch` на `await expect(...).rejects...`. Новые unit — только формулы и правила.
5. ~~**E2e границы валидации.**~~ Сделано для body, path и утечки полей. Отдельного теста на невалидный UUID в query нет.
6. **Workflow:** `pnpm test` + `pnpm test:e2e`, миграции Prisma перед e2e; падение job = блок merge (если используете PR).

**Не делать:** гоняться за покрытием `%` по всему `src` (`test:cov` на thin CRUD мало что даёт); дублировать e2e и unit для одного и того же «409 если имя занято»; unit на репозитории без отдельной цели — SQL проще держать e2e-сценарием + `EXPLAIN`, когда трогаете запросы (см. «Группы»).

**Критерий оставшегося:** защищённый роут без JWT даёт 401 в тесте; auth-защищённые маршруты покрыты сквозняком; негативный unit на stat падает, если сервис перестал кидать исключение; CI гоняет unit и e2e. Сложность: S–M.

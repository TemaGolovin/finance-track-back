-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "defaultKey" TEXT,
ADD COLUMN     "groupCategoryId" TEXT,
ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "GroupCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,

    CONSTRAINT "GroupCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalCategoryMap" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "PersonalCategoryMap_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GroupCategory_name_groupId_key" ON "GroupCategory"("name", "groupId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalCategoryMap_groupId_categoryId_userId_key" ON "PersonalCategoryMap"("groupId", "categoryId", "userId");

-- AddForeignKey
ALTER TABLE "GroupCategory" ADD CONSTRAINT "GroupCategory_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "UserRelationGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalCategoryMap" ADD CONSTRAINT "PersonalCategoryMap_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "GroupCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalCategoryMap" ADD CONSTRAINT "PersonalCategoryMap_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalCategoryMap" ADD CONSTRAINT "PersonalCategoryMap_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

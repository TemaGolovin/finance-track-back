-- DropForeignKey
ALTER TABLE "PersonalCategoryMap" DROP CONSTRAINT "PersonalCategoryMap_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "PersonalCategoryMap" DROP CONSTRAINT "PersonalCategoryMap_groupCategoryId_fkey";

-- AddForeignKey
ALTER TABLE "PersonalCategoryMap" ADD CONSTRAINT "PersonalCategoryMap_groupCategoryId_fkey" FOREIGN KEY ("groupCategoryId") REFERENCES "GroupCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalCategoryMap" ADD CONSTRAINT "PersonalCategoryMap_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

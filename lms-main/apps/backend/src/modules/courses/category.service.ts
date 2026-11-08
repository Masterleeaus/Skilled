import { prisma } from "../../config/prisma";
import { AppError, NotFoundError } from "../../utils/AppError";
import { slugify, slugWithSuffix } from "../../utils/slugify";

export async function createCategory(name: string, parentId?: string) {
  const baseSlug = slugify(name);
  const existing = await prisma.category.findUnique({ where: { slug: baseSlug } });
  const slug = existing ? slugWithSuffix(baseSlug) : baseSlug;

  return prisma.category.create({ data: { name, slug, parentId } });
}

export async function listCategories() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { children: true },
  });
}

export async function updateCategory(id: string, data: { name?: string; parentId?: string }) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw new NotFoundError("Category");

  if (data.parentId === id) throw new AppError("Category cannot be its own parent", 400);

  return prisma.category.update({ where: { id }, data });
}

export async function deleteCategory(id: string) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw new NotFoundError("Category");

  const coursesUsingIt = await prisma.course.count({ where: { categoryId: id } });
  if (coursesUsingIt > 0) {
    throw new AppError("Cannot delete a category that has courses assigned to it", 409);
  }

  await prisma.category.delete({ where: { id } }); // soft-delete via prisma extension
}

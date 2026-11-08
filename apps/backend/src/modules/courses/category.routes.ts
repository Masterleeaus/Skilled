import { param } from "../../utils/requestParams";
import { Router, Request, Response, NextFunction } from "express";
import { sendSuccess } from "../../utils/response";
import { authenticate } from "../../middleware/authenticate";
import { requirePermission } from "../../middleware/permission";
import { createCategorySchema, updateCategorySchema } from "./course.validators";
import * as categoryService from "./category.service";

const router = Router();

router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await categoryService.listCategories();
    return sendSuccess(res, categories);
  } catch (err) {
    next(err);
  }
});

router.post(
  "/",
  authenticate,
  requirePermission("course:create"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = createCategorySchema.parse(req.body);
      const category = await categoryService.createCategory(input.name, input.parentId);
      return sendSuccess(res, category, "Category created", 201);
    } catch (err) {
      next(err);
    }
  },
);

router.patch(
  "/:id",
  authenticate,
  requirePermission("course:update:any"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = updateCategorySchema.parse(req.body);
      const category = await categoryService.updateCategory(param(req, "id"), input);
      return sendSuccess(res, category, "Category updated");
    } catch (err) {
      next(err);
    }
  },
);

router.delete(
  "/:id",
  authenticate,
  requirePermission("course:delete"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await categoryService.deleteCategory(param(req, "id"));
      return sendSuccess(res, null, "Category deleted");
    } catch (err) {
      next(err);
    }
  },
);

export default router;

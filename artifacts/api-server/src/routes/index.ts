import { Router, type IRouter } from "express";
import healthRouter from "./health";
import countriesRouter from "./countries";
import recipesRouter from "./recipes";
import searchRouter from "./search";

const router: IRouter = Router();

router.use(healthRouter);
router.use(countriesRouter);
router.use(recipesRouter);
router.use(searchRouter);

export default router;

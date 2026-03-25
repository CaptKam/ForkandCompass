import { Router, type IRouter } from "express";
import healthRouter from "./health";
import countriesRouter from "./countries";
import recipesRouter from "./recipes";
import searchRouter from "./search";
import ninjaRouter from "./ninja";
import instacartRouter from "./instacart";
import waitlistRouter from "./waitlist";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(countriesRouter);
router.use(recipesRouter);
router.use(searchRouter);
router.use(ninjaRouter);
router.use(instacartRouter);
router.use(waitlistRouter);
router.use(adminRouter);

export default router;

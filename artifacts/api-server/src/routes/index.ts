import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import profileRouter from "./profile";
import notesRouter from "./notes";
import itemsRouter from "./items";
import auctionRouter from "./auction";
import shippingRouter from "./shipping";
import linksRouter from "./links";
import aiRouter from "./ai";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(profileRouter);
router.use(notesRouter);
router.use(itemsRouter);
router.use(auctionRouter);
router.use(shippingRouter);
router.use(linksRouter);
router.use(aiRouter);
router.use(dashboardRouter);

export default router;

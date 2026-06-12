import { Router, type IRouter } from "express";
import healthRouter from "./health";
import emailsRouter from "./emails";
import inboundRouter from "./inbound";
import templatesRouter from "./templates";
import domainsRouter from "./domains";
import suppressionsRouter from "./suppressions";
import statsRouter from "./stats";
import activityRouter from "./activity";

const router: IRouter = Router();

router.use(healthRouter);
router.use(emailsRouter);
router.use(inboundRouter);
router.use(templatesRouter);
router.use(domainsRouter);
router.use(suppressionsRouter);
router.use(statsRouter);
router.use(activityRouter);

export default router;

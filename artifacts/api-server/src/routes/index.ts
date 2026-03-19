import { Router, type IRouter } from "express";
import healthRouter from "./health";
import signalRouter from "./signal";
import signalOddEvenRouter from "./signal-odd-even";
import signalBasicRouter from "./signal-basic";
import signalSinusoidRouter from "./signal-sinusoid";
import signalEnergyRouter from "./signal-energy";
import signalConvolutionRouter from "./signal-convolution";
import signalFourierRouter from "./signal-fourier";
import signalSamplingRouter from "./signal-sampling";
import signalZTransformRouter from "./signal-ztransform";
import signalReportRouter from "./signal-report";

const router: IRouter = Router();

router.use(healthRouter);
router.use(signalRouter);
router.use(signalOddEvenRouter);
router.use(signalBasicRouter);
router.use(signalSinusoidRouter);
router.use(signalEnergyRouter);
router.use(signalConvolutionRouter);
router.use(signalFourierRouter);
router.use(signalSamplingRouter);
router.use(signalZTransformRouter);
router.use(signalReportRouter);

export default router;

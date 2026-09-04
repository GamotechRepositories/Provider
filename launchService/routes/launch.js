import { Router } from "express";
import { launch } from "../controllers/launchController.js";

const router = Router();

router.post("/launch", launch);

export default router;

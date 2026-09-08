import { Router } from "express";
import {
  listIntegrationsHandler,
  getIntegrationHandler,
  createIntegrationHandler,
  updateIntegrationHandler,
  updateIntegrationStatusHandler,
  deleteIntegrationHandler,
} from "../controllers/operatorIntegrationController.js";

const router = Router();

router.get("/integrations", listIntegrationsHandler);
router.get("/integrations/:operatorId", getIntegrationHandler);
router.post("/integrations", createIntegrationHandler);
router.put("/integrations/:operatorId", updateIntegrationHandler);
router.patch("/integrations/:operatorId/status", updateIntegrationStatusHandler);
router.delete("/integrations/:operatorId", deleteIntegrationHandler);

export default router;

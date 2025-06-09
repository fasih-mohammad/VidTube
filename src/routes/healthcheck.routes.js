import { Router } from "express";
import { healthCheck } from "../controllers/healthcheck.controllers.js";

const router = Router();
router.route("/").get(healthCheck);
//here route '/' means this '/api/v1/healthcheck' this is already present when control flows from app.js to routes.js.

export default router;

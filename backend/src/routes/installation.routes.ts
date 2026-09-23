import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import * as i from "../controllers/installation.controller.js";
export const installationRouter=Router();
installationRouter.use(authenticate);
installationRouter.get("/eligible-dispatches",i.eligibleDispatchesController);
installationRouter.get("/spare-items",i.spareItemsController);
installationRouter.get("/",i.listInstallationsController);
installationRouter.post("/",i.createInstallationController);
installationRouter.get("/:id",i.getInstallationController);
installationRouter.patch("/:id",i.updateInstallationController);
installationRouter.patch("/:id/checklist/:itemId",i.updateChecklistController);
installationRouter.patch("/:id/tests/:testId",i.updateCommissioningTestController);
installationRouter.post("/:id/spares",i.recordSpareMovementController);
installationRouter.post("/:id/warranty",i.activateWarrantyController);

installationRouter.post("/:id/site-updates",i.createSiteUpdateController);
installationRouter.post("/:id/reports",i.createInstallationReportController);
installationRouter.post("/:id/commissioning-certificate",i.generateCommissioningCertificateController);

installationRouter.post("/:id/site-photos",i.uploadSitePhotoController);

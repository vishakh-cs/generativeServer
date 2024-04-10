const express = require('express');
const path = require('path');
const fs = require('fs');
const workspaceController = require('../controller/workspaceController');
const multer = require('multer');

const router = express.Router();

const validateTokenMiddleware = require('../Middleware/ValidateToken');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = 'public/uploads';
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
  
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, Date.now() + ext);
    },
  });
  

const upload = multer({ storage: storage });

router.get('/protected_workspace/:workspaceId',workspaceController.ProtectedRouteData)

router.post('/BannerImageURL', workspaceController.bannerImageUpload);

router.post('/sidebar_data',workspaceController.sidebarUser)

router.get('/workspace/:workspaceId/:pageId',workspaceController.fechUserData);

router.post('/add_page',workspaceController.addPage)

router.get('/get_page/:pageId',workspaceController.getPage);

router.get('/find_collab_user',workspaceController.searchCollabUsers); 

router.post('/send_email_notification',workspaceController.sendEmailInvite);

router.post('/change_workspace_type',workspaceController.updateWorkspaceType);

router.get('/get_workspace_data/:workspaceId', workspaceController.getWorkspaceType);

router.get('/add_collab/:userEmail/:workspaceId', workspaceController.addCollabUser);

router.post('/add_to_trash',workspaceController.addToTrash);

router.get('/trashedData/:workspaceId',workspaceController.fetchTrashData);

router.post('/RestorePage/:pageId',workspaceController.restoreFromTrash);

router.delete('/deletePage/:pageId',workspaceController.deletePage);

router.post('/updateWorkspaceName',workspaceController.updateWorkspaceName);

router.get('/get_collaborating_users',workspaceController.getCollabUser)

router.post('/remove_collaborator',workspaceController.removeCollaborator);

router.post('/changeUsername',workspaceController.changeUsername);

router.get('/profileImages/:userId',workspaceController.getProfileImage);

router.get('/get_otherCollab_users',workspaceController.getOtherCollabUsers);

router.post('/leave_collaboration' ,workspaceController.leaveCollaboration );

router.post('/delete_workspace',workspaceController.deleteWorkspace);

router.get('/get_publish_data',workspaceController.getPublishData);

router.post('/publish_document',workspaceController.publishDocument);

router.post('/unpublish_document',workspaceController.unpublishDocument);


module.exports = router;
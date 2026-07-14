const express = require('express');
const multer = require('multer');
const { handleAssistant } = require('../ai/controller/aiController');
const { getKnowledgeIndex } = require('../ai/controller/knowledgeController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

const router = express.Router();

router.post('/assistant', upload.single('image'), handleAssistant);
router.get('/knowledge/index', getKnowledgeIndex);

module.exports = router;


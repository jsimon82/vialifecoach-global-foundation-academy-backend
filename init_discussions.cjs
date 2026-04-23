const { createDiscussionTables } = require('./src/models/CourseDiscussion.model.js');

async function initDiscussionTables() {
  try {
    await createDiscussionTables();
    console.log('Discussion tables initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing discussion tables:', error);
    process.exit(1);
  }
}

initDiscussionTables();

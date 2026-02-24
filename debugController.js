import { getAllCourses } from './src/controllers/course.controller.js';

// Mock request and response
const req = {};
const res = {
  status(code) {
    console.log('res.status called', code);
    return this;
  },
  json(data) {
    console.log('res.json called with', data);
    return this;
  }
};

(async () => {
  try {
    await getAllCourses(req, res);
    console.log('controller executed successfully');
  } catch (e) {
    console.error('controller threw', e);
  }
})();

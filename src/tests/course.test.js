import { expect } from 'chai';
import sinon from 'sinon';
import * as CourseService from '../services/course.service.js';
import * as CourseModel from '../models/Course.model.js';

describe('Course Service Tests', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('getCourseById', () => {
    it('should return a course when found', async () => {
      const mockCourse = { id: 1, title: 'Test Course', description: 'Test Description' };
      sandbox.stub(CourseModel, 'getCourseById').resolves(mockCourse);

      const result = await CourseService.getCourseById(1);

      expect(result).to.deep.equal(mockCourse);
      expect(CourseModel.getCourseById.calledOnceWith(1)).to.be.true;
    });

    it('should return null when course not found', async () => {
      sandbox.stub(CourseModel, 'getCourseById').resolves(null);

      const result = await CourseService.getCourseById(999);

      expect(result).to.be.null;
      expect(CourseModel.getCourseById.calledOnceWith(999)).to.be.true;
    });
  });

  describe('getAllCourses', () => {
    it('should return all courses', async () => {
      const mockCourses = [
        { id: 1, title: 'Course 1' },
        { id: 2, title: 'Course 2' },
      ];
      sandbox.stub(CourseModel, 'getAllCourses').resolves(mockCourses);

      const result = await CourseService.getAllCourses();

      expect(result).to.deep.equal(mockCourses);
      expect(CourseModel.getAllCourses.calledOnce).to.be.true;
    });
  });

  describe('createCourse', () => {
    it('should create a new course', async () => {
      const courseData = { title: 'New Course', description: 'New Description', instructor_id: 1 };
      const mockCreatedCourse = { id: 3, ...courseData };
      sandbox.stub(CourseModel, 'createCourse').resolves(mockCreatedCourse);

      const result = await CourseService.createCourse(courseData);

      expect(result).to.deep.equal(mockCreatedCourse);
      expect(CourseModel.createCourse.calledOnceWith(courseData)).to.be.true;
    });
  });

  describe('getCourseWithModules', () => {
    it('should return course with modules', async () => {
      const mockResult = {
        course: { id: 1, title: 'Test Course' },
        moduleLessonRows: []
      };
      sandbox.stub(CourseModel, 'getCourseWithModules').resolves(mockResult);

      const result = await CourseService.getCourseWithModules(1);

      expect(result).to.deep.equal(mockResult);
      expect(CourseModel.getCourseWithModules.calledOnceWith(1)).to.be.true;
    });
  });
});

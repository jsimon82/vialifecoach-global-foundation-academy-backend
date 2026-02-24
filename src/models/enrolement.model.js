//======enrolement.model.js=======
import { pool } from "../config/postgres.js";

// ======== ENROLL USER IN COURSE =============
export async function enrollUserInCourse(userId, courseId) {
  const { rows } = await pool.query(
    `INSERT INTO enrollment (user_id, course_id, enrolled_at)
     VALUES ($1, $2, NOW())
     RETURNING id`,
    [userId, courseId]
  );
  return rows[0]?.id;
}
// ======== GET ENROLLMENTS BY USER ID =============
export async function getEnrollmentsByUserId(userId) {  
  const { rows } = await pool.query(
    "SELECT * FROM enrollment WHERE user_id = $1",
    [userId]
  );
  return rows;
}
// ======== GET ENROLLMENTS BY COURSE ID =============
export async function getEnrollmentsByCourseId(courseId) {  
  const { rows } = await pool.query(
    "SELECT * FROM enrollment WHERE course_id = $1",
    [courseId]
  );
  return rows;
}
// ======== UNENROLL USER FROM COURSE =============
export async function unenrollUserFromCourse(userId, courseId) {    
  const result = await pool.query(
    "DELETE FROM enrollment WHERE user_id = $1 AND course_id = $2",
    [userId, courseId]
  );
  return result.rowCount;
}   
// ======== CHECK IF USER IS ENROLLED IN COURSE =============
export async function isUserEnrolledInCourse(userId, courseId) {                    
  const { rows } = await pool.query(
    "SELECT * FROM enrollment WHERE user_id = $1 AND course_id = $2",
    [userId, courseId]
  );
  return rows.length > 0;
} 
// ======== GET ALL ENROLLMENTS =============
export async function getAllEnrollments() { 
  const { rows } = await pool.query("SELECT * FROM enrollment");
  return rows;
}                       

export const getEnrollementsByUserId = getEnrollmentsByUserId;
export const getEnrollementsByCourseId = getEnrollmentsByCourseId;
export const getAllEnrollements = getAllEnrollments;

export async function deleteEnrollement(id) {
  const result = await pool.query("DELETE FROM enrollment WHERE id = $1", [id]);
  return result.rowCount;
}

export async function getEnrollementById(id) {
  const { rows } = await pool.query("SELECT * FROM enrollment WHERE id = $1", [id]);
  return rows[0];
}


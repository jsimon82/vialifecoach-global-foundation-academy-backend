
import { pool } from "../config/postgres.js";

// ====== GET INSTRUCTOR BY ID =========
export const getInstructorById = async(id)=>{
    const { rows } = await pool.query("select * from users where id = $1 and role = 'instructor'",[id])
    return rows[0];
}

// ====== GET ALL INSTRUCTORS =========
export const getAllInstructors = async()=>{
    const { rows } = await pool.query(" select * from users where role = 'instructor'")
    return rows;
}

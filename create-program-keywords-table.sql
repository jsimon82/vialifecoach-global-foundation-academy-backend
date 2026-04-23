-- Create program_ai_keywords table for VIALIFECOACH GLOBAL FOUNDATION REVIEW
-- This table stores program-specific keywords for AI evaluation

CREATE TABLE IF NOT EXISTS program_ai_keywords (
    id SERIAL PRIMARY KEY,
    program_name VARCHAR(255) NOT NULL,
    keywords TEXT NOT NULL, -- Comma-separated keywords
    weight DECIMAL(3,2) DEFAULT 1.0, -- Weight for scoring (1.0 = standard, higher = more important)
    category VARCHAR(50) DEFAULT 'general', -- Category: skills, experience, education, motivation, etc.
    active BOOLEAN DEFAULT true, -- Whether this keyword set is active
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add unique constraint to prevent duplicate keyword sets for same program
CREATE UNIQUE INDEX IF NOT EXISTS idx_program_keywords_unique 
ON program_ai_keywords (program_name, keywords);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_program_keywords_name ON program_ai_keywords (program_name);
CREATE INDEX IF NOT EXISTS idx_program_keywords_active ON program_ai_keywords (active);

-- Add some sample keywords for common programs
INSERT INTO program_ai_keywords (program_name, keywords, weight, category) VALUES
('Web Development', 'javascript,react,node,html,css,frontend,backend,fullstack,api,database', 2.0, 'skills'),
('Web Development', 'programming,coding,software,development,web,technology', 1.5, 'general'),
('Web Development', 'portfolio,projects,github,experience,years', 1.0, 'experience'),

('Data Science', 'python,机器学习,machine learning,data,analytics,statistics,sql,r', 2.0, 'skills'),
('Data Science', 'research,analysis,modeling,visualization,algorithms', 1.5, 'general'),
('Data Science', 'phd,master,degree,mathematics,statistics,computer science', 1.0, 'education'),

('Digital Marketing', 'marketing,digital,seo,sem,social media,content,advertising', 2.0, 'skills'),
('Digital Marketing', 'campaigns,analytics,metrics,conversion,roi', 1.5, 'general'),
('Digital Marketing', 'creative,strategy,communication,branding', 1.0, 'general'),

('Business Administration', 'business,management,leadership,strategy,finance,marketing', 2.0, 'skills'),
('Business Administration', 'mba,degree,management,experience,years', 1.5, 'education'),
('Business Administration', 'project,planning,organization,team,decision', 1.0, 'general')

ON CONFLICT (program_name, keywords) DO NOTHING;

-- Update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_program_ai_keywords_updated_at 
    BEFORE UPDATE ON program_ai_keywords 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE program_ai_keywords IS 'VIALIFECOACH GLOBAL FOUNDATION REVIEW - Program-specific keywords for AI evaluation';
COMMENT ON COLUMN program_ai_keywords.program_name IS 'Name of the program (e.g., Web Development, Data Science)';
COMMENT ON COLUMN program_ai_keywords.keywords IS 'Comma-separated keywords for matching in applications';
COMMENT ON COLUMN program_ai_keywords.weight IS 'Scoring weight (higher = more important for matching)';
COMMENT ON COLUMN program_ai_keywords.category IS 'Category type: skills, experience, education, motivation, general';
COMMENT ON COLUMN program_ai_keywords.active IS 'Whether this keyword set is currently active for evaluation';

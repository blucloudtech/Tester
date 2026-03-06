-- V3 Role-Based Access Control Schema Update

-- 1. Add assigned_to to bugs table
ALTER TABLE public.bugs 
ADD COLUMN assigned_to uuid REFERENCES public.users(id);

-- 2. Create project_users table for fine-grained project RBAC
CREATE TABLE public.project_users (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  role text CHECK (role IN ('tester', 'qa_lead', 'developer', 'admin')) DEFAULT 'tester',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(project_id, user_id)
);

ALTER TABLE public.project_users ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for project_users
-- Admins can view all, project members can view their own project's members
CREATE POLICY "Users can view project_users" ON public.project_users 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  ) OR
  user_id = auth.uid() OR
  project_id IN (SELECT project_id FROM public.project_users WHERE user_id = auth.uid())
);

-- Only admins and qa_leads can insert/update/delete members inside projects
CREATE POLICY "Admins and Leads can manage project_users" ON public.project_users
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  ) OR
  EXISTS (
    SELECT 1 FROM public.project_users pu WHERE pu.project_id = project_users.project_id AND pu.user_id = auth.uid() AND pu.role = 'qa_lead'
  )
);

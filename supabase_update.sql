ALTER TABLE public.integrations DROP CONSTRAINT integrations_provider_check;
ALTER TABLE public.integrations ADD CONSTRAINT integrations_provider_check CHECK (provider in ('jira', 'azure', 'slack', 'teams', 'outlook'));

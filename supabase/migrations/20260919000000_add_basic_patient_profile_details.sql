-- Basic patient-provided profile details for the Cognitive Care app.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS basic_patient_info jsonb NOT NULL DEFAULT '{}'::jsonb;

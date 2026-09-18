# Caregiver / Doctor Role-Separated Workspace — Implementation Prompt

Build and stabilize a production-quality caregiver and doctor experience for Cognitive Care NER while preserving the existing patient/Mino experience.

## Product goal
The login/sign-up flow must ask the person which account type they are creating or using:
- Patient
- Caregiver / family member
- Doctor / health worker

After authentication and profile completion, route each role to its own interface. Patients continue to receive the Mino cognitive-training dashboard. Caregivers and doctors receive a separate care-team dashboard focused on authorised patients, care coordination, progress, reminders, alerts and reports.

## Research-informed design requirements
Use current international digital-health patterns as references, not as copied branding:
- Australia My Health Record: patient-controlled sharing, authorised representatives, access controls, centralised health information and care coordination.
- Epic MyChart: proxy access, explicit patient/family sharing, visible account context and easy switching between authorised records.
- Japan MHLW care-information infrastructure: structured information sharing between users, care providers and medical institutions.
- Dubai Health Authority patient services: patient/dependant relationships, appointments and care access.
- WHO/WHO-ITU accessibility guidance and older-adult mHealth literature: large touch targets, readable typography, high contrast, simple navigation, reduced text entry, audio support, calm interfaces, consistent layouts and clear role-specific access.

Do not copy proprietary UI. Translate the useful interaction patterns into the Cognitive Care NER visual language.

## Role and access model
- Patient: sees own Mino training, progress, reminders, profile, privacy and Care Team.
- Caregiver: sees only patients with an active caregiver_links relationship.
- Doctor / health worker: sees only patients with an active caregiver_links relationship.
- Admin remains on the existing admin workflow.
- Never expose a searchable directory of all patients.
- Patient access must remain patient-controlled: show a Care Code in the patient's Care Team/Profile area that the patient can share with a trusted caregiver or doctor.
- A caregiver/doctor can paste a patient's Care Code to create an active caregiver_links relationship.
- Patient can revoke a care-team relationship.
- All patient information must remain protected by Supabase RLS; frontend role checks are UX routing only and never the authorization boundary.

## Care-team dashboard
Create a dedicated responsive workspace with:
- role-specific header: Caregiver workspace or Doctor / Health Worker workspace
- patient selector for linked patients
- overview cards: latest score, latest accuracy, sessions observed, average response
- patient profile summary
- cognitive progress / session history / game performance
- care plan area with reminders and daily tasks
- alerts area with caregiver alerts and severity
- clinical reports area, read-only unless an existing authorised workflow supports editing
- access area showing the current patient connection and allowing connection of another patient by Care Code
- sign out and safe return to patient app
- empty state for users with no linked patients
- clear privacy notice that training scores are not a diagnosis or clinical stage

## Patient Care Team
Add a Care Team entry to the patient navigation:
- display the patient's Care Code
- explain that it is a pairing identifier, not a password
- explain that only trusted caregivers/doctors should receive it
- make the sharing/revocation concept clear
- do not expose unrelated users' identities

## Accessibility and visual language
Use the existing pastel system but make the care workspace feel more like a calm clinical coordination tool:
- light pastel lavender/mint/sky/peach surfaces
- dark readable text
- large controls (at least 48px touch targets)
- strong focus states
- clear text labels in addition to icons
- flat navigation and generous spacing
- responsive desktop/tablet/mobile layouts
- no dense clinical tables on small screens without horizontal scrolling
- respect prefers-reduced-motion
- avoid red as a general decorative color; reserve urgent status for actual urgent alerts
- keep patient/Mino UI friendly and playful while keeping caregiver/doctor UI calm and professional

## Security and data handling
- Use only the authenticated Supabase client in browser code.
- Never expose service-role secrets.
- Enforce patient access with RLS, not localStorage or client-side role checks.
- Linked caregivers/doctors may read only linked patient profiles, cognitive_sessions, game_results, reminders, daily_tasks, caregiver_alerts and clinical_reports according to existing policies.
- Patient can only see and manage their own data and care links.
- Keep the existing audit/security mechanisms.
- Verify the RLS policies after changes.
- Do not turn training results into medical diagnoses or risk labels.

## Validation
After implementation:
1. Validate JavaScript syntax and references.
2. Verify login role selection persists the selected role.
3. Verify patient routes to patient dashboard.
4. Verify caregiver routes to caregiver workspace.
5. Verify doctor/health-worker routes to doctor workspace.
6. Verify no linked patient produces a useful connection screen.
7. Verify Care Code linking works with caregiver_links.
8. Verify linked patient data is visible only through RLS-authorised queries.
9. Verify unlinked patient data is not returned.
10. Verify Android and web use the same root implementation.
11. Run the repository quality gate and inspect any failures.
12. Re-check Supabase security advisors and document unrelated existing warnings separately.

## Output
The implementation should be complete enough to demonstrate the full role-separated flow end-to-end with the existing Supabase schema, while clearly distinguishing training performance from clinical assessment.

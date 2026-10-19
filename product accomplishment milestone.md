CAS Journals — Product Accomplishment Milestones
Document: product accomplishment milestone.md
Project: CAS Journals
Deadline target: Wednesday, October 21, 2026
Objective: Deliver a functional, secure, tested, and deployment-ready academic journal management platform.
1. Product completion definition
CAS Journals is ready for deployment only when:
- Authors can register or sign in through the supported authentication flow and submit manuscripts.
- Journal administrators and Super Admins can manage their authorized journals.
- Editors and reviewers can access their assigned work without blank pages or incorrect permissions.
- Manuscripts can progress through the supported editorial workflow.
- Important workflow events generate correct, persistent notifications.
- Public journal and article pages render correctly and expose crawlable content.
- The interface is consistent, responsive, and usable.
- Sensitive manuscripts and administrative functions are properly protected.
- Automated tests and production-build checks pass.
- Critical workflows have been verified in a real browser.
- Database migrations, environment configuration, authentication, storage, and deployment procedures have been reviewed.
- No unresolved P0 or P1 defects remain.
A passing test suite alone does not establish deployment readiness.
2. Two-agent operating model
Agent A — Backend and application logic
Primary responsibility: Correctness, security, persistence, and business logic.
Owns:
- Authentication and session resolution.
- User identity and role management.
- Journal-specific permissions.
- Database models, queries, and migrations.
- Manuscript submission and editorial workflows.
- Notification events and recipient resolution.
- File upload, storage, and access control.
- Backend APIs and server-side validation.
- Backend tests and security checks.
Agent B — Frontend and user experience
Primary responsibility: A complete, consistent, functional user interface.
Owns:
- Public website and journal pages.
- Author dashboard and submission interface.
- Editor and reviewer interfaces.
- Journal administration interfaces.
- Navigation, layout, and reusable components.
- Light and dark themes.
- Responsive behaviour and accessibility.
- Loading, empty, success, and error states.
- Frontend tests and browser-based UI verification.
Shared responsibilities
Both agents contribute to:
- Integration testing.
- End-to-end workflow verification.
- Bug reproduction and evidence gathering.
- Release readiness.
Agent A remains responsible for backend correctness; Agent B remains responsible for frontend correctness.
Coordination rules
1. One agent, one clearly defined task at a time. They may work independently on separate files, but shared integration happens sequentially.
2. Before starting, each agent checks the current Git status and existing modifications.
3. Neither agent may discard, reset, revert, overwrite, or silently incorporate the other's pending work.
4. Changes to shared contracts—such as API response formats, authentication behaviour, database models, and shared types—must be agreed upon before implementation.
5. Agent B must not independently change backend permissions or database behaviour to make a page work.
6. Agent A must not redesign the interface to work around a backend defect.
7. Agent A and Agent B must not run multiple unnecessary development servers. Reuse the existing server when possible.
8. The IMSUFOSS repository remains strictly read-only.
9. No commits, pushes, deployments, production database writes, migrations, secret changes, or destructive operations without explicit approval.
Working principle: Independent implementation, sequential integration, shared verification.
3. Milestone roadmap
Milestone 0 — Baseline and project protection
Priority: P0
Owners: Agent A + Agent B, sequentially
Status: Required before further implementation
Objective
Establish the current state of CAS Journals and protect all existing work.
Deliverables
- Git status and branch recorded.
- Existing changes and untracked files inventoried.
- Current development server identified.
- Current tests, lint, TypeScript, and build status established where practical.
- Major application routes and workflows inventoried.
- Existing architectural parity audit findings recorded.
Acceptance criteria
- No existing changes are lost.
- The team knows which functionality is implemented and which is verified.
- No duplicate development server is started unnecessarily.
- IMSUFOSS remains untouched.
- Known failures are documented rather than silently treated as fixed.
Completion evidence
A baseline report containing repository state, test results, known defects, and outstanding work.
Gate: Do not begin conflicting work until ownership and the current state are clear.
Milestone 1 — Authentication, identity, and authorization
Priority: P0
Owner: Agent A
Frontend support: Agent B
Objective
Ensure existing users and development users receive the correct permissions and can access their authorized interfaces.
Required work
- Investigate the existing Gmail account that receives a blank page at /editor/izu.
- Compare its identity and role resolution with the seeded test account that works.
- Audit session handling, database user lookup, global roles, and journal-specific assignments.
- Verify authorization for authors, editors, reviewers, journal administrators, and Super Admins.
- Ensure unauthorized users cannot access restricted pages or data.
- Ensure missing data and permission errors are handled explicitly.
Acceptance criteria
- Existing accounts with valid permissions can access their intended dashboards.
- Development accounts work through the supported development authentication flow.
- Editors only access authorized journals and assignments.
- Reviewers cannot access unrelated assignments.
- Journal administrators cannot administer unauthorized journals.
- Super Admin privileges behave as intended.
- Invalid or missing permissions produce appropriate error states instead of blank pages.
- Development authentication shortcuts cannot bypass production security.
Completion evidence
- Regression tests for the editor blank-page failure.
- Tests covering role and journal authorization.
- Browser verification of working and previously failing account types.
- Documented root cause and implemented resolution.
Gate: No core workflow testing should be considered reliable until identity and authorization are understood.
Milestone 2 — Manuscript submission and editorial workflows
Priority: P0
Owner: Agent A
Frontend support: Agent B
Objective
Ensure manuscripts can move through the actual supported journal workflow.
Required work
- Validate manuscript submission and persistence.
- Verify journal selection and author association.
- Confirm .docx upload requirements and file handling.
- Verify submission confirmation and duplicate-submission protection.
- Ensure submissions appear in the appropriate editorial interface.
- Audit manuscript assignment and reviewer assignment.
- Verify review submission and editorial decisions.
- Verify tracking ID generation, assignment, and display.
- Verify submission status transitions and author visibility.
Acceptance criteria
- An author can submit a valid manuscript successfully.
- Invalid submissions produce understandable errors.
- Successful submissions persist exactly once.
- The correct journal receives the submission.
- Authorized editorial users can access the manuscript.
- Unauthorized users cannot access private manuscripts.
- Assignment and review actions persist correctly.
- Tracking IDs behave consistently with the implemented workflow.
- Authors can see the appropriate submission status.
- Workflow failures do not silently corrupt existing records.
Completion evidence
A documented end-to-end test covering submission, editorial visibility, assignment, and the supported review or decision workflow.
Gate: The core manuscript workflow must work before the platform can be considered release-ready.
Milestone 3 — Complete notification architecture
Priority: P0
Owner: Agent A
Frontend support: Agent B
Objective
Make notifications cover meaningful editorial workflow events, not just chat messages.
Required events to audit
Event	Intended recipients
New manuscript submitted	Super Admin and authorized administrator for the target journal
Manuscript assigned to editor	Assigned editor
Manuscript assigned to reviewer	Assigned reviewer
Review submitted	Responsible editorial recipient
Editorial decision recorded	Relevant author and authorized editorial participants
Tracking ID assigned	Author and other relevant recipients where appropriate
Internal chat message	Intended recipient, excluding the sender
Request message	Intended recipient or responsible administrator
Important status change	Users responsible for the next workflow step


These recipients must be confirmed against the actual role model and business rules.
Required work
- Identify real workflow entry points.
- Establish consistent notification event handling.
- Resolve recipients using persisted identities and journal-specific permissions.
- Persist notifications reliably.
- Prevent duplicate notifications.
- Maintain accurate unread and read states.
- Provide working links to the appropriate destination.
- Ensure notification failure does not corrupt the underlying business operation.
- Ensure one journal's activity does not notify unrelated journal administrators.
Acceptance criteria
- New manuscript submissions notify the Super Admin and the authorized administrator for the target journal.
- Assignment events notify the correct assigned users.
- Notifications are persisted and survive page refreshes.
- Unread counts update correctly.
- Opening a notification leads to the correct authorized destination.
- Duplicate events do not produce duplicate notifications.
- The sender is excluded where appropriate.
- Failures are observable and handled safely.
- Automated tests cover recipient selection and event behaviour.
Completion evidence
An event coverage matrix and browser tests proving the notification flow for manuscript submission and internal messaging, plus other implemented workflow events.
Gate: No critical editorial event should be silently missing its required notification.
Milestone 4 — Frontend completeness and design consistency
Priority: P1
Owner: Agent B
Backend support: Agent A
Objective
Deliver a consistent CAS Journals experience without breaking existing functionality.
Required work
Audit:
- Public landing page.
- Journal directory and individual journal pages.
- Authentication screens.
- Author dashboard.
- Manuscript submission form.
- Submission tracking and status views.
- Editor dashboard.
- Reviewer dashboard.
- Journal administration.
- Super Admin dashboard.
- Internal chat and notifications.
- Account settings and navigation.
Design requirements
- Use the established CAS navy and sky-blue palette.
- Maintain consistent typography, spacing, borders, and cards.
- Ensure light and dark themes work correctly.
- Preserve dark mode as the established theme while making the toggle functional.
- Ensure navigation reflects the user's permissions.
- Provide clear loading, empty, error, and success states.
- Remove unintended IMSUFOSS branding or inconsistent interface elements.
Acceptance criteria
- All major routes render without blank screens.
- Primary actions are functional, not merely decorative.
- Forms provide useful validation and feedback.
- Navigation leads to the correct destinations.
- Layouts work at desktop, tablet, and mobile sizes.
- Theme switching works without breaking component readability.
- Accessible labels, keyboard interaction, and visible focus states are present for key interactions.
- No major console errors occur during core workflows.
Completion evidence
A route-by-route UI checklist and browser screenshots or recordings showing the major user journeys.
Gate: No broken primary navigation, blank dashboard, or unusable core form remains.
Milestone 5 — Public journal pages and scholarly discoverability
Priority: P1
Owner: Agent B
Backend support: Agent A
Objective
Ensure public scholarly content is accessible to users and search engines without exposing private material.
Required work
- Verify public journal pages.
- Verify article detail pages and their metadata.
- Check canonical URLs and page titles.
- Check sitemap and robots directives.
- Confirm important links exist in crawlable HTML.
- Verify public content is not dependent entirely on client-side interactions.
- Confirm private manuscripts and editorial content remain protected.
- Review structured metadata where supported.
Acceptance criteria
- Public journal pages return meaningful content.
- Public article pages expose appropriate metadata.
- Important pages are reachable through ordinary HTML links.
- Canonical URLs are consistent.
- Sitemap entries correspond to valid public pages.
- Private manuscripts are not exposed through public routes, metadata, or indexing.
- No unsupported ISSNs, publication schedules, or other scholarly metadata are fabricated.
Completion evidence
A crawlability report covering representative journal and article pages, metadata, links, and privacy boundaries.
Important: Technical readiness for indexing does not guarantee that Google Scholar will index or accept the content.
Milestone 6 — Security, privacy, and integration
Priority: P0
Owners: Agent A + Agent B, sequential integration
Objective
Verify that the frontend and backend operate together without introducing security or data-integrity problems.
Required work
Agent A
- Review authorization boundaries.
- Verify private file access.
- Check API validation and error handling.
- Check database integrity and migration requirements.
- Review notification recipient permissions.
- Verify development-only authentication behaviour.
Agent B
- Check protected routes and unauthorized states.
- Verify frontend actions respect actual backend permissions.
- Ensure private data is not displayed in inappropriate interfaces.
- Check form error handling and session-expiration behaviour.
- Verify the interface does not mistake failed API requests for successful operations.
Acceptance criteria
- Frontend restrictions are not the only protection for sensitive operations.
- Server-side authorization is enforced.
- Private manuscript files require appropriate authorization.
- Users cannot access unrelated journal data by changing URLs or identifiers.
- API errors do not leak secrets or sensitive implementation details.
- Successful UI messages correspond to successful backend operations.
- No unresolved critical security or privacy defect remains.
- Required migrations are identified and their execution status is known.
Completion evidence
Security checklist, permission tests, integration tests, and a documented migration status.
Gate: Any unresolved critical authorization or private-data exposure issue blocks deployment.
Milestone 7 — Full end-to-end verification
Priority: P0
Owners: Agent A + Agent B
Objective
Prove the integrated application works from the perspective of actual users.
Required user journeys
Journey A — Author
1. Sign in.
2. Select a journal.
3. Submit a valid manuscript.
4. See confirmation.
5. Access submission status.
6. Receive relevant notifications.
Journey B — Journal administrator and Super Admin
1. Sign in with the appropriate role.
2. Access authorized journal administration.
3. Receive the new-submission notification.
4. Open the correct manuscript.
5. Perform permitted editorial actions.
Journey C — Editor
1. Sign in with an existing valid account.
2. Open the correct journal dashboard.
3. View assigned manuscripts.
4. Perform supported editorial actions.
5. Receive relevant assignment and workflow notifications.
Journey D — Reviewer
1. Sign in.
2. View assigned review work.
3. Access the authorized manuscript.
4. Submit a review.
5. Verify the workflow and notification consequences.
Journey E — Security boundaries
1. Attempt to access an unauthorized journal.
2. Attempt to access an unrelated manuscript.
3. Attempt to use an inappropriate role for a protected action.
4. Verify that access is denied without exposing private information.
Acceptance criteria
- All applicable journeys complete successfully.
- Failed operations provide clear feedback.
- Data persists correctly.
- Notifications reach the intended recipients.
- Authorization boundaries hold.
- No critical browser console or server errors remain.
- Results distinguish automated tests from actual browser verification.
Completion evidence
A test report recording the user journey, account type, outcome, failures, and relevant evidence.
Milestone 8 — Deployment readiness
Priority: P0
Owners: Agent A + Agent B, sequential final review
Objective
Establish that the application is ready to deploy safely.
Required checks
Application quality
- [ ] Automated test suite passes.
- [ ] ESLint passes.
- [ ] TypeScript passes.
- [ ] Production build succeeds.
- [ ] Critical end-to-end journeys pass.
- [ ] No unresolved P0 or P1 defects remain.
- [ ] No unexplained blank pages remain on primary routes.
Authentication and security
- [ ] Production authentication flow has been verified.
- [ ] Production OAuth configuration has been reviewed.
- [ ] Development-only authentication cannot be enabled accidentally in production.
- [ ] Role and journal permissions have been tested.
- [ ] Private manuscript access has been verified.
- [ ] No secrets are committed or exposed.
Database and infrastructure
- [ ] Required migrations are documented.
- [ ] Migration status is explicitly confirmed.
- [ ] Production database schema is compatible with the release.
- [ ] No unapproved production database changes are pending.
- [ ] Storage bucket visibility and file permissions are correct.
- [ ] Required environment variables are documented without exposing their values.
User experience
- [ ] Major desktop routes are verified.
- [ ] Responsive layouts are verified.
- [ ] Light and dark themes work.
- [ ] Forms, notifications, and navigation work.
- [ ] Empty and error states are understandable.
Release safety
- [ ] Current Git changes have been reviewed.
- [ ] No unrelated changes are included.
- [ ] A rollback strategy exists.
- [ ] Required database rollback or forward-recovery considerations are documented.
- [ ] Deployment steps are documented.
- [ ] The user has reviewed and approved the release.
Final acceptance rule
CAS Journals is deployment-ready only when all mandatory checks pass, all P0/P1 issues are resolved, required production configuration is verified, and deployment has been explicitly approved.
A successful local build is necessary but not sufficient.
4. Priority definitions
Priority	Definition	Release policy
P0	Critical security, data-integrity, authorization, or core workflow failure	Must be resolved before deployment
P1	Major functionality broken or an essential user journey incomplete	Must be resolved before deployment
P2	Important improvement that does not block core operation or security	May be deferred with documented approval
P3	Cosmetic polish or nonessential enhancement	May be deferred


Do not downgrade an issue merely because fixing it is inconvenient.
5. Two-agent execution sequence
To avoid conflicts, use this sequence:
Step	Agent	Task
1	Agent A	Establish backend baseline and investigate authentication, roles, and workflow gaps
2	Agent B	Audit the frontend and map primary routes, missing states, and UI inconsistencies
3	Agent A	Address approved backend defects and notification requirements
4	Agent B	Address approved frontend defects using agreed backend contracts
5	Agent A	Verify backend tests and integration contracts
6	Agent B	Verify frontend routes, themes, and responsive behaviour
7	Both, sequentially	Run integrated end-to-end tests and resolve remaining defects
8	Both, sequentially	Complete deployment-readiness checklist
9	User approval	Decide whether to commit, push, migrate, or deploy


The agents can work independently on clearly separated tasks, but integration must happen sequentially.
6. Final release decision
At the end of Milestone 8, report one of these statuses:
NOT READY
- A P0 or P1 issue remains.
- A mandatory workflow is broken.
- Production authentication or authorization is unverified.
- Required database or environment changes are unresolved.
READY FOR FINAL APPROVAL
- Mandatory checks pass.
- Remaining P2/P3 issues are documented.
- Deployment and rollback procedures are prepared.
- The user must still authorize the release.
APPROVED FOR DEPLOYMENT
- All mandatory checks pass.
- The user has explicitly authorized deployment.
- Required deployment prerequisites have been verified.
Never infer deployment permission from a passing test suite or a previous approval for unrelated work.
7. Current milestone tracking
Use this table to track actual progress rather than relying on an agent's general claim that the project is finished.
Milestone	Status	Evidence	Blockers
M0 — Baseline	Not verified	Pending	Establish current state
M1 — Authentication and authorization	In progress	Editor account discrepancy reported	Root cause unresolved
M2 — Submission and editorial workflows	Not verified	Pending end-to-end checks	Verify complete workflow
M3 — Notification architecture	In progress	Chat/request handlers reportedly connected	Audit missing events and recipients
M4 — Frontend completeness	Not verified	Partial browser inspection	Full route and responsive audit
M5 — Scholarly discoverability	Not verified	Previous indexing work exists	Verify current implementation
M6 — Security and integration	Not verified	Existing tests reported	Verify end-to-end boundaries
M7 — Full end-to-end verification	Not verified	Pending	Execute all applicable journeys
M8 — Deployment readiness	Blocked	Pending	Complete mandatory checks


Status definitions:
- Not started
- In progress
- Blocked
- Verified
- Approved
A milestone can only be marked Verified when its acceptance criteria are supported by evidence.
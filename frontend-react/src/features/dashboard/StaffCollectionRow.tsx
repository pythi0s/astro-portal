import { PanelShell } from '@/features/dashboard/PanelShell';

/**
 * Admin-only staff collection breakdown.
 *
 * The `/dashboard/staff-collection` endpoint (audit NEW-03) was intentionally
 * deferred in Step 3 — no product signal yet. Rather than ship an empty box
 * we render a clearly-labelled "coming soon" placeholder, gated by role
 * exactly as the spec requires. The component must be conditionally mounted
 * by the parent via `hasRole('admin')`, not merely hidden via CSS.
 */
export function StaffCollectionRow() {
  return (
    <PanelShell title="Staff collection rate" subtitle="Admin only">
      <div className="text-sm text-midnight-700">
        Per-staff collection breakdown is planned for a follow-up step. The
        backend currently exposes aggregate collection rate only.
      </div>
    </PanelShell>
  );
}

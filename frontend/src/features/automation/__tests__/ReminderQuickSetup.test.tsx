import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server, fakeAdminUser } from '@/test/msw';
import { renderWithProviders } from '@/test/renderWithProviders';
import { ReminderQuickSetup } from '@/features/automation/components/ReminderQuickSetup';
import { AutomationRuleForm } from '@/features/automation/components/AutomationRuleForm';
import { useAuthStore } from '@/stores/auth';
import type { AutomationRule } from '@/features/automation/types';

describe('<ReminderQuickSetup />', () => {
  it('creates templates and confirmation + reminder rules for the chosen channel', async () => {
    useAuthStore.setState({ token: 't', user: fakeAdminUser, isBooting: false });
    const templates: Record<string, unknown>[] = [];
    const rules: Record<string, unknown>[] = [];
    server.use(
      http.post('/api/templates/', async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        templates.push(body);
        return HttpResponse.json({ id: templates.length, ...body });
      }),
      http.post('/api/admin/automation-rules/', async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        rules.push(body);
        return HttpResponse.json({ id: rules.length, ...body }, { status: 201 });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<ReminderQuickSetup existing={[]} />);

    await user.click(screen.getByRole('button', { name: /set up whatsapp reminders/i }));

    expect(await screen.findByText(/whatsapp reminders are on/i)).toBeInTheDocument();
    expect(templates).toHaveLength(3);
    expect(templates.every((t) => t.channel === 'whatsapp' && t.subject === null)).toBe(true);
    expect(String(templates[1]?.body)).toContain('{{appointment_time}}');
    expect(rules.map((r) => [r.trigger, r.offset_hours, r.template_id])).toEqual([
      ['appointment_booked', 0, 1],
      ['appointment_reminder', 24, 2],
      ['appointment_reminder', 2, 3],
    ]);
  });

  it('shows channels that already have active appointment rules as done', () => {
    const existing = [
      { id: 1, trigger: 'appointment_reminder', channel: 'email', is_active: true },
    ] as unknown as AutomationRule[];
    renderWithProviders(<ReminderQuickSetup existing={existing} />);
    expect(screen.getByText(/email reminders active/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /set up whatsapp reminders/i })).toBeEnabled();
  });
});

describe('<AutomationRuleForm /> appointment triggers', () => {
  it('asks for hours before the appointment and hides the send window', async () => {
    useAuthStore.setState({ token: 't', user: fakeAdminUser, isBooting: false });
    server.use(
      http.get('/api/templates/', () =>
        HttpResponse.json([{ id: 7, name: 'WA reminder', channel: 'whatsapp', trigger_type: 'custom', subject: null, body: 'x', is_active: true, created_at: '', updated_at: '' }]),
      ),
    );
    let submitted: unknown = null;
    const user = userEvent.setup();
    renderWithProviders(
      <AutomationRuleForm
        submitLabel="Create"
        onCancel={() => undefined}
        onSubmit={async (v) => {
          submitted = v;
        }}
      />,
    );

    await user.type(screen.getByLabelText(/rule name/i), 'Day before');
    await user.selectOptions(screen.getByLabelText(/trigger/i), 'appointment_reminder');
    await user.selectOptions(screen.getByLabelText(/channel/i), 'whatsapp');
    await waitFor(() => expect(screen.getByRole('option', { name: 'WA reminder' })).toBeInTheDocument());
    await user.selectOptions(screen.getByLabelText(/template/i), '7');
    expect(screen.getByLabelText(/hours before appointment/i)).toHaveValue(24);
    expect(screen.queryByLabelText(/start hour/i)).not.toBeVisible();
    expect(screen.getByText(/ignore the send window/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() =>
      expect(submitted).toMatchObject({ trigger: 'appointment_reminder', offset_hours: 24, template_id: 7 }),
    );
  });
});

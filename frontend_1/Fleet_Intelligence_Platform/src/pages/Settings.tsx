import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

const Settings = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <div className="rounded-lg border bg-card p-6 card-shadow space-y-6">
        <div>
          <h3 className="font-semibold mb-4">Profile</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input defaultValue={user?.name} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input defaultValue={user?.email} />
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="font-semibold mb-4">Notifications</h3>
          <div className="space-y-4">
            {[
              { label: 'Critical alerts', desc: 'Get notified for critical vehicle alerts', defaultChecked: true },
              { label: 'Maintenance reminders', desc: 'Scheduled maintenance notifications', defaultChecked: true },
              { label: 'Battery health warnings', desc: 'When SoH drops below threshold', defaultChecked: true },
              { label: 'Charging complete', desc: 'When a vehicle finishes charging', defaultChecked: false },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Switch defaultChecked={item.defaultChecked} />
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div className="flex justify-end">
          <button className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-default">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;

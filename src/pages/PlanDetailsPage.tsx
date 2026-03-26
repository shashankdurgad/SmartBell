import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { PageHeader } from '../components/shared/PageHeader';
import { PlanPreview } from '../components/generator/PlanPreview';
import { PlanEditor } from '../components/generator/PlanEditor';
import { FullPageSpinner } from '../components/shared/Spinner';
import { useWeeklyPlanStore } from '../stores/useWeeklyPlanStore';
import type { WeeklyPlan } from '../types';
import { Modal } from '../components/shared/Modal';
import { Button } from '../components/shared/Button';

export function PlanDetailsPage() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { plans, loadPlans, setActivePlan, deletePlan, updatePlan } = useWeeklyPlanStore();
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    async function fetch() {
      let allPlans = plans;
      if (allPlans.length === 0) {
        await loadPlans();
        allPlans = useWeeklyPlanStore.getState().plans;
      }
      const found = allPlans.find((p) => p.id === planId);
      setPlan(found || null);
      setIsLoading(false);
    }
    fetch();
  }, [planId, plans, loadPlans]);

  if (isLoading) {
    return <FullPageSpinner />;
  }

  if (!plan) {
    return (
      <div className="min-h-screen pb-24">
        <PageHeader title="Plan Not Found" showBack />
        <div className="max-w-lg mx-auto px-4 py-6">
          <p className="text-center text-gray-text">The plan you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const handleDelete = async () => {
    await deletePlan(plan.id);
    navigate('/');
  };

  const handleSetActive = async () => {
    setActivePlan(plan);
    navigate('/');
  };

  const handleSaveEdits = async (updatedPlan: WeeklyPlan) => {
    await updatePlan(updatedPlan);
    setPlan(updatedPlan);
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen pb-24">
      <PageHeader title={plan.name} showBack />

      <div className="max-w-lg mx-auto px-4 py-6">
        {isEditing ? (
          <PlanEditor
            plan={plan}
            onSave={handleSaveEdits}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <>
            <PlanPreview 
              plan={plan} 
              onRegenerate={() => navigate('/')}
              regenerateLabel="Dashboard"
              showRegenerateButton={false}
              onSetActive={handleSetActive}
              onDelete={() => setShowDeleteConfirm(true)}
              onEdit={() => setIsEditing(true)}
            />
          </>
        )}
      </div>

      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)}>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Delete Plan?</h3>
          <p className="text-sm text-gray-text">
            This action cannot be undone. {plan.name} will be permanently deleted.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)} className="flex-1">
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} className="flex-1">
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

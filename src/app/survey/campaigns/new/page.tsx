'use client';

import React from 'react';
import AppShell from '@/components/layout/AppShell';
import SurveyCampaignForm from '@/components/survey/SurveyCampaignForm';

export default function NewSurveyCampaignPage() {
  return (
    <AppShell>
      <SurveyCampaignForm />
    </AppShell>
  );
}

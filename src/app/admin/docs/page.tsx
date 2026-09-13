'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DocsContent } from '@/components/docs/DocsContent';

export default function AdminDocsPage() {
  return (
    <DashboardLayout>
      <DocsContent inAdmin={true} />
    </DashboardLayout>
  );
}

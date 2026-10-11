'use client'
import InnerPageManager from '@/components/dashboard/InnerPageManager'
import { use } from 'react'

export default function DynamicInnerPage({ params }) {
  // Extract section from dynamic params
  const { section } = use(params)
  
  return <InnerPageManager sectionKey={section} title={`${section} Pages Management`} />
}

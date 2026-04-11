'use client'
import { useParams } from 'next/navigation'
import CakeForm from '@/components/admin/CakeForm'
export default function EditCakePage() {
  const { id } = useParams()
  return <CakeForm cakeId={id as string} />
}

'use client'

import { useState, useCallback } from 'react'
import { BarcodeInput } from './BarcodeInput'
import { GradeSelector } from './GradeSelector'
import { CameraCapture } from './CameraCapture'
import { ImagePreview, type ImageFile } from './ImagePreview'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { compressImage } from '@/lib/utils/image-compression'
import type { Product, Location, ProductGrade } from '@/lib/types/database'
import { addToSyncQueue } from '@/lib/sync/offlineStore'
import { BarcodeGenerator } from './BarcodeGenerator'
import { createProductAndInboundEntry } from '@/actions/inbound'
import { createClient } from '@/lib/supabase/client'

interface InboundFormProps {
  products: Product[]
  locations: Location[]
  userRole?: string
}

export function InboundForm({ products, locations, userRole = 'staff' }: InboundFormProps) {
  const [isNewProductMode, setIsNewProductMode] = useState(false)
  
  // Existing product mode
  const [skuInput, setSkuInput] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  
  // New product mode
  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [newLotDate, setNewLotDate] = useState(new Date().toISOString().slice(2, 10).replace(/-/g, '')) // e.g. 260629
  const [newWarehouseCode, setNewWarehouseCode] = useState('WH01')
  const [newCostPrice, setNewCostPrice] = useState('')
  const [newStatus, setNewStatus] = useState('AVAILABLE')

  // Shared
  const [selectedGrade, setSelectedGrade] = useState<ProductGrade | null>(null)
  const [quantity, setQuantity] = useState('1')
  const [locationId, setLocationId] = useState('')
  const [images, setImages] = useState<ImageFile[]>([])
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isCompressing, setIsCompressing] = useState(false)
  
  // Barcode Printing State
  const [showBarcode, setShowBarcode] = useState(false)
  const [lastSavedSku, setLastSavedSku] = useState<{ sku: string, name: string } | null>(null)

  const handleScan = useCallback((barcode: string) => {
    let found = products.find(
      (p) => p.sku?.toLowerCase() === barcode.toLowerCase()
    )
    if (!found) {
      const matches = products.filter(
        (p) => p.sku?.toLowerCase().includes(barcode.toLowerCase()) ||
               p.name?.toLowerCase().includes(barcode.toLowerCase())
      )
      if (matches.length > 0) {
        found = matches[0]
        if (matches.length > 1) {
          showToast('success', `พบสินค้าใกล้เคียง ${matches.length} รายการ เลือก: ${found.name}`)
        } else {
          showToast('success', `พบสินค้า: ${found.name}`)
        }
      }
    } else {
      showToast('success', `พบสินค้า: ${found.name}`)
    }

    if (found) {
      setSelectedProduct(found)
      setSelectedGrade(found.grade as ProductGrade | null)
    } else {
      setSelectedProduct(null)
      showToast('error', `ไม่พบสินค้าใกล้เคียงกับ SKU: ${barcode}`)
    }
  }, [products])

  const handleCapture = useCallback(async (file: File) => {
    setIsCompressing(true)
    try {
      const preview = URL.createObjectURL(file)
      const compressed = await compressImage(file)
      setImages((prev) => [...prev, { file, preview, compressed }])
    } catch (err) {
      console.error('Image processing error:', err)
      showToast('error', 'ไม่สามารถประมวลผลรูปภาพได้')
    } finally {
      setIsCompressing(false)
    }
  }, [])

  const handleRemoveImage = useCallback((index: number) => {
    setImages((prev) => {
      const newImages = [...prev]
      URL.revokeObjectURL(newImages[index].preview)
      newImages.splice(index, 1)
      return newImages
    })
  }, [])

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  // Upload image to Supabase Storage (client-side) for new product since it's not queued via offline queue yet (to keep demo simple, new products shouldn't rely entirely on offline sync if they need immediate SKU return, or we can just online create it)
  const uploadImage = async (file: File): Promise<string | null> => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const fileExt = 'webp'
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`

    const { error } = await supabase.storage
      .from('product-images')
      .upload(fileName, file, { contentType: 'image/webp' })

    if (error) return null

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName)

    return publicUrl
  }

  const handleSubmit = async () => {
    if (!quantity || parseInt(quantity) < 1) {
      showToast('error', 'กรุณาระบุจำนวนที่ถูกต้อง')
      return
    }

    setIsSubmitting(true)

    try {
      if (isNewProductMode) {
        if (!newName || !newCategory || !newLotDate || !newWarehouseCode || !selectedGrade || (userRole === 'owner' && !newCostPrice)) {
          showToast('error', 'กรุณากรอกข้อมูลสินค้าใหม่ให้ครบถ้วน')
          setIsSubmitting(false)
          return
        }
        
        let imageUrl: string | null = null
        if (images.length > 0) {
          imageUrl = await uploadImage(images[0].compressed || images[0].file)
        }

        const formData = new FormData()
        formData.set('name', newName)
        formData.set('category', newCategory)
        formData.set('lot_date', newLotDate)
        formData.set('warehouse_code', newWarehouseCode)
        if (userRole === 'owner') {
          formData.set('cost_price', newCostPrice)
        } else {
          formData.set('cost_price', '0') // default or hide
        }
        formData.set('grade', selectedGrade)
        formData.set('status', newStatus)
        formData.set('quantity', quantity)
        if (locationId) formData.set('location_id', locationId)
        if (imageUrl) formData.set('image_proof_url', imageUrl)

        const result = await createProductAndInboundEntry(formData)
        
        if (result.error) {
          showToast('error', result.error)
        } else {
          showToast('success', `บันทึกสินค้าใหม่สำเร็จ!`)
          setLastSavedSku({ sku: result.sku as string, name: result.name as string })
          setShowBarcode(true)
          resetForm()
        }

      } else {
        if (!selectedProduct) {
          showToast('error', 'กรุณาสแกนหรือเลือกสินค้า')
          setIsSubmitting(false)
          return
        }

        const payload: any = {
          product_id: selectedProduct.id,
          quantity,
          grade: selectedGrade || ''
        }
        if (locationId) payload.location_id = locationId
        if (images.length > 0) {
          payload.image_file = images[0].compressed || images[0].file
        }

        await addToSyncQueue({ type: 'INBOUND', payload })

        showToast('success', `บันทึกสำเร็จ (Pending Sync)!`)
        setLastSavedSku({ sku: selectedProduct.sku, name: selectedProduct.name })
        setShowBarcode(true)
        resetForm()
      }
    } catch (err) {
      console.error('Submit error:', err)
      showToast('error', 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setSkuInput('')
    setSelectedProduct(null)
    setNewName('')
    setNewCostPrice('')
    setSelectedGrade(null)
    setQuantity('1')
    setLocationId('')
    images.forEach(img => URL.revokeObjectURL(img.preview))
    setImages([])
  }

  const locationOptions = locations.map((loc) => ({
    value: loc.id,
    label: `${loc.zone_name} (${loc.barcode_ref})`,
  }))

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex bg-slate-900 rounded-xl p-1 border border-white/10">
        <button
          onClick={() => setIsNewProductMode(false)}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${!isNewProductMode ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
        >
          สแกนรับของเดิม
        </button>
        <button
          onClick={() => setIsNewProductMode(true)}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${isNewProductMode ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
        >
          สร้างสินค้าใหม่ (Gen SKU)
        </button>
      </div>

      {!isNewProductMode ? (
        <>
          <Card>
            <BarcodeInput
              value={skuInput}
              onChange={setSkuInput}
              onScan={handleScan}
              disabled={isSubmitting}
            />
          </Card>
          {selectedProduct && (
            <Card className="border-indigo-500/20 bg-indigo-500/5 animate-in fade-in-50 duration-200">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <p className="text-white font-medium text-sm">{selectedProduct.name}</p>
                  <p className="text-xs text-white/50 font-mono mt-0.5">SKU: {selectedProduct.sku}</p>
                  {selectedProduct.grade && (
                    <div className="mt-1">
                      <Badge variant={selectedProduct.grade === 'Premium' ? 'premium' : selectedProduct.grade === '1' ? 'grade1' : selectedProduct.grade === '2' ? 'grade2' : 'grade3'}>
                        {selectedProduct.grade === 'Premium' ? 'Premium' : `เกรด ${selectedProduct.grade}`}
                      </Badge>
                    </div>
                  )}
                </div>
                <Button 
                  onClick={() => {
                    setLastSavedSku({ sku: selectedProduct.sku, name: selectedProduct.name })
                    setShowBarcode(true)
                  }}
                  size="sm"
                  variant="secondary"
                  className="min-h-[36px] text-xs py-1"
                >
                  พิมพ์ป้าย (Print)
                </Button>
              </div>
            </Card>
          )}
        </>
      ) : (
        <Card className="space-y-4 animate-in slide-in-from-right-4">
          <Input label="ชื่อสินค้า (Product Name)" value={newName} onChange={e => setNewName(e.target.value)} disabled={isSubmitting} />
          
          <div className="grid grid-cols-2 gap-3">
            <Input label="หมวดหมู่ (Category)" placeholder="เช่น DENIM" value={newCategory} onChange={e => setNewCategory(e.target.value.toUpperCase())} disabled={isSubmitting} />
            <Input label="รหัสโกดัง (Warehouse)" value={newWarehouseCode} onChange={e => setNewWarehouseCode(e.target.value.toUpperCase())} disabled={isSubmitting} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="วันที่/รอบ (Lot Date)" value={newLotDate} onChange={e => setNewLotDate(e.target.value)} disabled={isSubmitting} />
            {userRole === 'owner' && (
              <Input label="ต้นทุน (Cost Price)" type="number" value={newCostPrice} onChange={e => setNewCostPrice(e.target.value)} disabled={isSubmitting} />
            )}
          </div>

          <Select
            label="สถานะรับเข้า (Status)"
            options={[
              { value: 'AVAILABLE', label: 'พร้อมขาย (Available)' },
              { value: 'IN-BALE', label: 'ยังอยู่ในกระสอบ (In-Bale)' }
            ]}
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            disabled={isSubmitting}
          />
        </Card>
      )}

      {/* Grade Selector */}
      <Card>
        <GradeSelector value={selectedGrade} onChange={setSelectedGrade} disabled={isSubmitting} />
      </Card>

      {/* Quantity & Location */}
      <Card>
        <div className="space-y-4">
          <Input
            label="จำนวนรับเข้า"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            disabled={isSubmitting}
          />
          <Select
            label="ตำแหน่งจัดเก็บ (Location)"
            options={locationOptions}
            placeholder="เลือกตำแหน่ง..."
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
      </Card>

      {/* Camera */}
      <Card>
        <CameraCapture onCapture={handleCapture} disabled={isSubmitting || isCompressing} />
        {isCompressing && (
          <div className="text-indigo-400 text-sm mt-3 animate-pulse">กำลังบีบอัดรูปภาพ...</div>
        )}
        <ImagePreview images={images} onRemove={handleRemoveImage} className="mt-3" />
      </Card>

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        isLoading={isSubmitting}
        disabled={(!isNewProductMode && !selectedProduct) || isSubmitting}
        className="w-full h-14"
        size="lg"
      >
        บันทึกรับเข้า {isNewProductMode ? '(Gen SKU)' : ''}
      </Button>

      {/* Barcode Modal */}
      {showBarcode && lastSavedSku && (
        <BarcodeGenerator 
          sku={lastSavedSku.sku} 
          name={lastSavedSku.name} 
          onClose={() => setShowBarcode(false)} 
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 left-4 right-4 z-[100] animate-slide-in-up">
          <div className={`rounded-xl px-4 py-3 shadow-2xl flex items-center gap-3 ${toast.type === 'success' ? 'bg-emerald-500/90' : 'bg-red-500/90'} text-white backdrop-blur-sm`}>
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  )
}

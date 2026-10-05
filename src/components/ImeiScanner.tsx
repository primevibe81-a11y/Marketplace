'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Button } from '@/components/ui/button'
import { Camera, X } from 'lucide-react'

export function ImeiScanner({ onScan }: { onScan: (imei: string) => void }) {
  const [isScanning, setIsScanning] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)

  useEffect(() => {
    return () => {
      if (scannerRef.current && isScanning) {
        scannerRef.current.stop().catch(console.error)
      }
    }
  }, [isScanning])

  const startScanner = async () => {
    setIsScanning(true)
    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode("reader", { formatsToSupport: [0, 4, 5, 6], verbose: false })
        scannerRef.current = scanner
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 100 }
          },
          (decodedText) => {
            const imeiMatch = decodedText.replace(/\D/g, '')
            if (imeiMatch.length >= 14 && imeiMatch.length <= 15) {
              scanner.stop()
              setIsScanning(false)
              onScan(imeiMatch)
            }
          },
          (error) => {
            // ignore constant read errors
          }
        )
      } catch (err) {
        console.error("Scanner failed", err)
        setIsScanning(false)
        alert('Gagal membuka kamera. Pastikan izin diberikan.')
      }
    }, 100)
  }

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().then(() => {
        setIsScanning(false)
      }).catch(console.error)
    } else {
      setIsScanning(false)
    }
  }

  if (isScanning) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm bg-background rounded-lg overflow-hidden">
          <div className="p-3 flex justify-between items-center border-b">
            <h3 className="font-semibold">Scan Barcode IMEI</h3>
            <Button variant="ghost" size="icon" onClick={stopScanner}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div id="reader" className="w-full h-[300px]"></div>
          <div className="p-3 text-center text-sm text-muted-foreground">
            Arahkan kamera ke barcode IMEI pada kotak.
          </div>
        </div>
      </div>
    )
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={startScanner} className="flex gap-2 w-full">
      <Camera className="h-4 w-4" /> Scan dari Kardus
    </Button>
  )
}

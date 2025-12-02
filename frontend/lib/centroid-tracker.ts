// Client-side Centroid Tracker untuk backup/local processing

interface TrackedObject {
  id: number
  centroid: [number, number]
  label: string
  disappeared: number
}

export class CentroidTracker {
  private nextObjectId = 0
  private objects: Map<number, [number, number]> = new Map()
  private disappeared: Map<number, number> = new Map()
  private labels: Map<number, string> = new Map()
  private maxDisappeared: number

  constructor(maxDisappeared = 80) {
    this.maxDisappeared = maxDisappeared
  }

  register(centroid: [number, number], label: string): void {
    this.objects.set(this.nextObjectId, centroid)
    this.disappeared.set(this.nextObjectId, 0)
    this.labels.set(this.nextObjectId, label)
    this.nextObjectId++
  }

  deregister(objectId: number): void {
    this.objects.delete(objectId)
    this.disappeared.delete(objectId)
    this.labels.delete(objectId)
  }

  update(inputCentroids: [number, number][], inputLabels: string[]): Map<number, [number, number]> {
    if (inputCentroids.length === 0) {
      for (const objectId of this.disappeared.keys()) {
        const count = (this.disappeared.get(objectId) || 0) + 1
        this.disappeared.set(objectId, count)

        if (count > this.maxDisappeared) {
          this.deregister(objectId)
        }
      }
      return this.objects
    }

    if (this.objects.size === 0) {
      for (let i = 0; i < inputCentroids.length; i++) {
        this.register(inputCentroids[i], inputLabels[i])
      }
    } else {
      const objectIds = Array.from(this.objects.keys())
      const objectCentroids = Array.from(this.objects.values())

      // Calculate distances (simplified - use actual Hungarian algorithm for production)
      const distances: number[][] = []
      for (const objectCentroid of objectCentroids) {
        const row: number[] = []
        for (const inputCentroid of inputCentroids) {
          const dx = objectCentroid[0] - inputCentroid[0]
          const dy = objectCentroid[1] - inputCentroid[1]
          row.push(Math.sqrt(dx * dx + dy * dy))
        }
        distances.push(row)
      }

      const usedRows = new Set<number>()
      const usedCols = new Set<number>()

      // Simple greedy matching
      for (let row = 0; row < distances.length; row++) {
        let minCol = -1
        let minDist = Number.POSITIVE_INFINITY

        for (let col = 0; col < distances[row].length; col++) {
          if (!usedCols.has(col) && distances[row][col] < minDist) {
            minDist = distances[row][col]
            minCol = col
          }
        }

        if (minCol !== -1 && minDist < 50) {
          const objectId = objectIds[row]
          this.objects.set(objectId, inputCentroids[minCol])
          this.labels.set(objectId, inputLabels[minCol])
          this.disappeared.set(objectId, 0)
          usedRows.add(row)
          usedCols.add(minCol)
        }
      }

      // Handle unmatched objects
      for (let row = 0; row < objectIds.length; row++) {
        if (!usedRows.has(row)) {
          const objectId = objectIds[row]
          const count = (this.disappeared.get(objectId) || 0) + 1
          this.disappeared.set(objectId, count)

          if (count > this.maxDisappeared) {
            this.deregister(objectId)
          }
        }
      }

      // Register new objects
      for (let col = 0; col < inputCentroids.length; col++) {
        if (!usedCols.has(col)) {
          this.register(inputCentroids[col], inputLabels[col])
        }
      }
    }

    return this.objects
  }

  getObjects(): Map<number, [number, number]> {
    return this.objects
  }

  getLabels(): Map<number, string> {
    return this.labels
  }

  reset(): void {
    this.nextObjectId = 0
    this.objects.clear()
    this.disappeared.clear()
    this.labels.clear()
  }
}

import DrawingContext from './drawing-context'
import UpdatedGeoReceiver from './geo-receiver'
import DrawingControl from './drawing-control'
import { Shape } from '../shape-utils'
import {
  GeometryJSON,
  GeometryJSONProperties,
  makeBufferedGeo,
  makeEmptyGeometry,
  geoToExtent,
} from '../geometry'
import GeoJSON from 'ol/format/GeoJSON'
import Feature from 'ol/Feature'
import { Type } from 'ol/geom/Geometry'

type GeoProps = GeometryJSONProperties & {
  [index: string]: any
}

abstract class BasicDrawingControl implements DrawingControl {
  protected context: DrawingContext
  protected receiver: UpdatedGeoReceiver
  protected geoFormat: GeoJSON
  protected mouseDragActive: boolean
  protected drawingActive: boolean
  protected properties: GeoProps

  abstract setGeo(geoJSON: GeometryJSON): void

  abstract startDrawing(): void

  protected constructor(context: DrawingContext, receiver: UpdatedGeoReceiver) {
    this.context = context
    this.receiver = receiver
    this.geoFormat = new GeoJSON()
    this.mouseDragActive = false
    this.drawingActive = false
    this.setProperties(makeEmptyGeometry('', this.getShape()).properties)
  }

  setProperties(properties: GeoProps): void {
    this.properties = {
      ...properties,
      shape: this.getShape(),
    }
  }

  getProperties(): GeoProps {
    return this.properties
  }

  protected applyPropertiesToFeature(feature: Feature) {
    if (this.properties.id) {
      feature.setId(this.properties.id)
    }
    Object.keys(this.properties).forEach((key) => {
      if (key !== 'id') {
        feature.set(key, this.properties[key])
      }
    })
  }

  protected abstract getShape(): Shape

  protected abstract getGeoType(): Type

  protected featureToGeo(feature: Feature): GeometryJSON {
    return this.geoFormat.writeFeatureObject(feature) as GeometryJSON
  }

  protected writeExtendedGeoJSON(feature: Feature): GeometryJSON {
    const shape = this.getShape()
    const geo = this.featureToGeo(feature)
    const bufferedGeo = makeBufferedGeo({
      ...geo,
      properties: {
        ...geo.properties,
        shape,
      },
    } as GeometryJSON)
    return {
      ...geo,
      bbox: geoToExtent(bufferedGeo),
      properties: {
        ...this.properties,
        shape,
      },
    }
  }

  cancelDrawing(): void {
    this.context.removeListeners()
    this.context.removeInteractions()
    this.drawingActive = false
  }

  setActive(active: boolean): void {
    this.context.setInteractionsActive(active)
  }

  isActive() {
    return this.context.areInteractionsActive()
  }

  isMouseDragActive(): boolean {
    return this.mouseDragActive
  }

  isDrawing(): boolean {
    return this.drawingActive
  }

  updateBuffer(buffer: number, bufferUnit: string): void {
    // no buffer applied to basic drawings
    console.debug(buffer)
    console.debug(bufferUnit)
  }
}

export default BasicDrawingControl
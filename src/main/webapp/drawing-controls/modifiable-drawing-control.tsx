import * as ol from 'openlayers'
import DrawingContext from './drawing-context'
import UpdatedGeoReceiver from './geo-receiver'
import BasicDrawingControl from './basic-drawing-control'
import { GeometryJSON } from '../geometry'

abstract class ModifiableDrawingControl extends BasicDrawingControl {
  protected constructor(context: DrawingContext, receiver: UpdatedGeoReceiver) {
    super(context, receiver)
    this.onCompleteDrawing = this.onCompleteDrawing.bind(this)
    this.onStartDrawing = this.onStartDrawing.bind(this)
    this.onCompleteModify = this.onCompleteModify.bind(this)
  }

  getGeoJSONFromCompleteDrawEvent(e: any): GeometryJSON {
    return this.writeExtendedGeoJSON(e.feature)
  }

  getGeoJSONFromCompleteModifyEvent(e: any): GeometryJSON {
    return this.writeExtendedGeoJSON(e.features.getArray()[0])
  }

  onCompleteDrawing(e: any) {
    const geoJSON = this.getGeoJSONFromCompleteDrawEvent(e)
    this.mouseDragActive = false
    const feature = this.makeFeature(geoJSON)
    this.applyPropertiesToFeature(feature)
    this.context.updateFeature(feature)
    this.context.updateBufferFeature(feature)
    this.receiver(geoJSON)
  }

  onStartDrawing(_e: any) {
    this.mouseDragActive = true
  }

  onStartModify(_e: any) {
    this.mouseDragActive = true
  }

  onCompleteModify(e: any) {
    this.mouseDragActive = true
    this.context.updateBufferFeature(e.features.getArray()[0])
    this.receiver(this.getGeoJSONFromCompleteModifyEvent(e))
  }

  makeFeature(geoJSON: GeometryJSON): ol.Feature {
    const feature = this.geoFormat.readFeature(geoJSON)
    if (feature.getGeometry().getType() !== this.getGeoType()) {
      throw new Error(
        `Wrong geometry type! expected ${this.getGeoType()} but got ${feature
          .getGeometry()
          .getType()} instead.`
      )
    }
    return feature
  }

  getStaticStyle(feature: ol.Feature): ol.style.Style | ol.style.Style[] {
    const style = this.context.getStyle()
    if (typeof style === 'function') {
      return style(feature, 1)
    } else {
      return style
    }
  }

  protected abstract makeEmptyFeature(): ol.Feature

  getDefaultStaticStyle(): ol.style.Style | ol.style.Style[] {
    const feature = this.makeEmptyFeature()
    this.applyPropertiesToFeature(feature)
    return this.getStaticStyle(feature)
  }

  setGeo(geoJSON: GeometryJSON): void {
    this.cancelDrawing()
    this.setProperties((geoJSON as GeometryJSON).properties || {})
    const feature = this.makeFeature(geoJSON)
    this.applyPropertiesToFeature(feature)
    this.context.updateFeature(feature)
    this.context.updateBufferFeature(feature)
    const drawInteraction = new ol.interaction.Draw({
      type: this.getGeoType(),
      style: this.getStaticStyle(feature),
    })
    this.startDrawingInteraction(drawInteraction)
  }

  startDrawing(): void {
    this.context.removeFeature()
    const drawInteraction = new ol.interaction.Draw({
      type: this.getGeoType(),
      style: this.getDefaultStaticStyle(),
    })
    this.startDrawingInteraction(drawInteraction)
  }

  updateBuffer(buffer: number, bufferUnit: string): void {
    this.context.updateBuffer(buffer, bufferUnit)
  }

  private startDrawingInteraction(
    drawInteraction: ol.interaction.Interaction
  ): void {
    this.drawingActive = true
    this.context.setDrawInteraction(drawInteraction)
    this.context.setEvent('draw', 'drawend', this.onCompleteDrawing)
    this.context.setEvent('draw', 'drawstart', this.onStartDrawing)
    this.context.setEvent('modify', 'modifyend', this.onCompleteModify)
    this.context.setEvent('modify', 'modifystart', this.onStartModify)
    this.context.addInteractions()
  }
}

export default ModifiableDrawingControl

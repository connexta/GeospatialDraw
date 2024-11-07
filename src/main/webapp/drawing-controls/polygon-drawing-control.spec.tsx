import { Polygon } from 'ol/geom'
import Feature from 'ol/Feature'
import { expect } from 'chai'
import PolygonDrawingControl from './polygon-drawing-control'
import MockDrawingContext from './test/mock-drawing-context'

describe('PolygonDrawingControl', () => {
  const makeFeature = () =>
    new Feature({
      geometry: new Polygon([
        [
          [50, 50],
          [10, 10],
          [20, 20],
          [50, 50],
        ],
      ]),
      color: '#996600',
      shape: 'Polygon',
      id: '',
      buffer: 0,
      bufferUnit: 'meters',
    })
  const makeGeoJSON = () => ({
    type: 'Feature',
    properties: {
      color: '#996600',
      shape: 'Polygon',
      id: '',
      buffer: 0,
      bufferUnit: 'meters',
    },
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [50, 50],
          [10, 10],
          [20, 20],
          [50, 50],
        ],
      ],
    },
    bbox: [10, 10, 50, 50],
  })
  let context: MockDrawingContext = new MockDrawingContext()
  let recievedGeo: any = null
  const receiver = (geoJSON: any) => {
    recievedGeo = geoJSON
  }
  let control: PolygonDrawingControl = new PolygonDrawingControl(
    context as any,
    receiver
  )
  beforeEach(() => {
    recievedGeo = null
    context = new MockDrawingContext()
    control = new PolygonDrawingControl(context as any, receiver)
  })
  describe('constructor', () => {
    it('default', () => {
      expect(control).to.not.equal(undefined)
      expect(control).to.not.equal(null)
    })
  })
  describe('onCompleteDrawing', () => {
    it('default', () => {
      control.onCompleteDrawing({
        feature: makeFeature(),
      })
      const expected = makeGeoJSON()
      expect(recievedGeo).to.deep.equal(expected)
      expect(context.getMethodCalls().updateFeature.length).to.equal(1)
    })
    it('startDrawing -> onCompleteDrawing', () => {
      const startGeo = makeGeoJSON()
      startGeo.geometry.coordinates = [
        [
          [88, 5],
          [22, 15],
          [64, 20],
          [88, 5],
        ],
      ]
      control.startDrawing()
      // @ts-ignore
      control.setGeo(startGeo)
      control.onCompleteDrawing({
        feature: makeFeature(),
      })
      const expected = makeGeoJSON()
      expected.properties.color = '#996600'
      expect(recievedGeo).to.deep.equal(expected)
    })
  })
  describe('onCompleteModify', () => {
    it('default', () => {
      control.onCompleteModify({
        features: {
          getArray: () => [makeFeature()],
        },
      })
      const expected = makeGeoJSON()
      expect(recievedGeo).to.deep.equal(expected)
    })
  })
  describe('setGeo', () => {
    it('default', () => {
      // @ts-ignore
      control.setGeo(makeGeoJSON())
      expect(context.getMethodCalls().updateFeature.length).to.equal(1)
      expect(context.getMethodCalls().removeFeature.length).to.equal(0)
      expect(control.isDrawing()).to.equal(true)
    })
  })
  describe('startDrawing', () => {
    it('default', () => {
      control.startDrawing()
      expect(context.getMethodCalls().addInteractions.length).to.equal(1)
      expect(context.getMethodCalls().setEvent.length).to.equal(4)
      expect(context.getMethodCalls().setDrawInteraction.length).to.equal(1)
      expect(context.getMethodCalls().updateFeature.length).to.equal(0)
      expect(context.getMethodCalls().removeFeature.length).to.equal(1)
      expect(control.isDrawing()).to.equal(true)
    })
  })
  describe('cancelDrawing', () => {
    it('default', () => {
      control.cancelDrawing()
      expect(context.getMethodCalls().removeListeners.length).to.equal(1)
      expect(context.getMethodCalls().removeInteractions.length).to.equal(1)
      expect(control.isDrawing()).to.equal(false)
    })
  })
})

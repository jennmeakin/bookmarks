/** @babel */

import {CompositeDisposable} from 'atom'

export default class Bookmarks {
  static deserialize (editor, state) {
    return new Bookmarks(editor, editor.getMarkerLayer(state.markerLayerId))
  }

  constructor (editor, markerLayer) {
    this.editor = editor
    this.markerLayer = markerLayer || this.editor.addMarkerLayer({persistent: true})
    this.decorationLayer = this.editor.decorateMarkerLayer(this.markerLayer, {type: "line-number", class: "bookmarked"})
    this.disposables = new CompositeDisposable()
    this.disposables.add(atom.commands.add(atom.views.getView(this.editor), {
      "bookmarks:toggle-bookmark": this.toggleBookmark.bind(this),
      "bookmarks:jump-to-next-bookmark": this.jumpToNextBookmark.bind(this),
      "bookmarks:jump-to-previous-bookmark": this.jumpToPreviousBookmark.bind(this),
      "bookmarks:clear-bookmarks": this.clearBookmarks.bind(this)
    }))
    this.disposables.add(this.editor.onDidDestroy(this.destroy.bind(this)))
  }

  destroy () {
    this.deactivate()
    this.markerLayer.destroy()
  }

  deactivate () {
    this.decorationLayer.destroy()
    this.disposables.dispose()
  }

  serialize () {
    return {markerLayerId: this.markerLayer.id}
  }

  toggleBookmark () {
    for (const range of this.editor.getSelectedBufferRanges()) {
      const bookmarks = this.markerLayer.findMarkers({intersectsRowRange: [range.start.row, range.end.row]})
      if (bookmarks && bookmarks.length > 0) {
        for (const bookmark of bookmarks) {
          bookmark.destroy()
        }
      } else {
        const bookmark = this.markerLayer.markBufferRange(range, {invalidate: "surround", exclusive: true})
        this.disposables.add(bookmark.onDidChange(({isValid}) => {
          if (!isValid) {
            bookmark.destroy()
          }
        }))
      }
    }
  }

  clearBookmarks () {
    for (const bookmark of this.markerLayer.getMarkers()) {
      bookmark.destroy()
    }
  }

  jumpToNextBookmark () {
    if (this.markerLayer.getMarkerCount() > 0) {
      const bufferRow = this.editor.getLastCursor().getMarker().getStartBufferPosition().row
      const markers = this.markerLayer.getMarkers().sort((a, b) => a.compare(b))
      const bookmarkMarker = markers.find((marker) => marker.getBufferRange().start.row > bufferRow) || markers[0]
      this.editor.setSelectedBufferRange(bookmarkMarker.getBufferRange(), {autoscroll: false})
      this.editor.scrollToCursorPosition()
    } else {
      atom.beep()
    }
  }

  jumpToPreviousBookmark () {
    if (this.markerLayer.getMarkerCount() > 0) {
      const bufferRow = this.editor.getLastCursor().getMarker().getStartBufferPosition().row
      const markers = this.markerLayer.getMarkers().sort((a, b) => b.compare(a))
      const bookmarkMarker = markers.find((marker) => marker.getBufferRange().start.row < bufferRow) || markers[0]
      this.editor.setSelectedBufferRange(bookmarkMarker.getBufferRange(), {autoscroll: false})
      this.editor.scrollToCursorPosition()
    } else {
      atom.beep()
    }
  }
}

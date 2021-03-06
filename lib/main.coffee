{CompositeDisposable} = require 'atom'

Bookmarks = null
ReactBookmarks = null
BookmarksView = require './bookmarks-view'
editorsBookmarks = null
disposables = null

module.exports =
  activate: (bookmarksByEditorId) ->
    editorsBookmarks = []
    bookmarksView = null
    disposables = new CompositeDisposable

    atom.commands.add 'atom-workspace',
      'bookmarks:view-all', ->
        bookmarksView ?= new BookmarksView(editorsBookmarks)
        bookmarksView.show()

    atom.workspace.observeTextEditors (textEditor) ->
      Bookmarks ?= require './bookmarks'
      if state = bookmarksByEditorId[textEditor.id]
        bookmarks = Bookmarks.deserialize(textEditor, state)
      else
        bookmarks = new Bookmarks(textEditor)
      editorsBookmarks.push(bookmarks)
      disposables.add textEditor.onDidDestroy ->
        index = editorsBookmarks.indexOf(bookmarks)
        editorsBookmarks.splice(index, 1) if index isnt -1
        bookmarks.destroy()

  deactivate: ->
    bookmarksView?.destroy()
    bookmarks.deactivate() for bookmarks in editorsBookmarks
    disposables.dispose()

  serialize: ->
    bookmarksByEditorId = {}
    for bookmarks in editorsBookmarks
      bookmarksByEditorId[bookmarks.editor.id] = bookmarks.serialize()
    bookmarksByEditorId

Match to filename with secondary reference

Click here to see this page in full context

####  Match to filename with secondary reference

When Match to filename with secondary reference is enabled, the matching logic
identifies existing files whose Client Reference or Alternative Reference
matches the filename of the document being uploaded.Â

When documents with the same filename but two different filetypes, one of
which is a specified Attachment Type for the category, are uploaded together,
it is assumed that you are trying to upload new versions of a parent and its
attachments. The documents of the Attachment Type filetype will be identified
as new versions of the attachments. The remaining document will be identified
as a new version of the parent.

If no Attachment Type is set in that category, the matching logic instead
examines the file extension of the filenames, and identifies a match that way.
Note  If the filename does not have the same file extension as the existing
parent document, that document will be assumed to be a new version of the
parent anyway, unless the filename matches the secondary reference of multiple
existing documents. In that case, you will be able to select the correct
parent.


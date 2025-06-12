Uploading and Downloading Documents

Click here to see this page in full context

##  Uploading and Downloading Documents

FusionLive allows you to upload and download documents into your workspace.
You can also create placeholders for documents that are expected but not yet
available.Â

###  Document matching

When you upload documents, the upload process can automatically detect whether
the document being uploaded is a new document, content for a placeholder, a
new version of an existing document or an attachment to an existing document.Â

If the Enable CAD reference check setting is enabled, it will also check if it
is a parent or child associated with another drawing.Â

The matching logic compares the filename of each document selected for upload
with the references of files already in the workspace. If the Match to
filename with secondary reference feature is enabled, the filename will also
be matched against the client reference and alternative reference (see [ Match
to filename with secondary reference ](Match_t.htm) ).

If the Enable CAD reference check setting is enabled, and the AutoCAD drawing
was downloaded from FusionLive, it will also look for a match with the object
ID which is automatically added to AutoCAD files when they are downloaded.Â

This matching is controlled by one of the following workspace settings. Ask
your workspace administrator for more details.

Matching LogicÂ Â Â  |  Description   
---|---  
Exact matchingÂ Â Â  |  The filename of the document selected for upload must match the reference of a document in the workspace exactly.   
Starts with matchingÂ Â Â  |  The reference of an existing document must match the characters at the start of the filename of the document selected for upload. For example: uploading a document called A1_2012.pdf will match a document called A1.pdf in the workspace.   
Fuzzy matchingÂ Â Â  |  The reference of a document in the workspace must match the characters in any part of the filename of the document selected for upload. For example: uploading a document called DRAFT_A1_2012.pdf will match a document called A1.pdf in the workspace.   
No matchÂ Â Â  |  Reference matching is not enabled.   
  
Â

For CAD files, matching is done against a unique Object ID. This allows
FusionLive to account for a CAD fileâs associations when it is updated. This
feature must also be enabled by the administrators.

Ask your workspace administrator for more details.


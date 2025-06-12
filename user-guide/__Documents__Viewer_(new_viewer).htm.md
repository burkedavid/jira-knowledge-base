Viewer (new viewer)

Click here to see this page in full context

###  Viewer (new viewer)

FusionLive has begun the phased introduction of a new document viewing
platform. The new technology allows you to view and mark up documents as
before, but offers a wider array of markup features in addition to full
integration with FusionLive's Tag Management and Issue Management modules.

Note  Bookmark annotations are not supported in the new viewer.Â

In the initial phase, the new viewer can be turned on for individual
workspaces. Markups made in the old viewer will be automatically converted
when a document is opened in the new viewer.

Note  If a document which contains markups made in the old viewer is still on
a review activity when the switchover occurs, the old viewer will continue to
be used for that document until the review is closed. When the document is
next opened after the review is closed, it will open in the new viewer and the
existing markups converted.Â For this reason, it is important to open such
documents in the new viewer before reopening the formal review.

Note  While the majority of annotations will be converted without issue, some
might appear differently in the new viewer. Specifically, text annotations
will be slightly repositioned, and images, engineering symbols, and standard
and custom stamps created in the old viewer that have been rotated may not be
displayed correctly. This is due to limitations in the old viewer technology.

Note  Once the new viewer has been turned on for that workspace, you cannot
revert to the old viewer.Â  
The FusionLive Viewer allows you to view documents independently of their
native application. This most often applies to drawing files (output from
applications such as AutoCAD or MicroStation) circulated for review and
comment to non-drawing personnel. You can add text and annotation markups,
compare documents and publish versions of marked-up documents. The following
file types are supported.

Type  |  Description  |  Type  |  Description  |  Type  |  Description   
---|---|---|---|---|---  
DWG  |  AutoCAD drawing  |  DOCX  |  Microsoft Word document  |  TIF  |  TIFF image   
DXF  |  AutoCADÂ DXF  |  DOC  |  Microsoft Word document  |  JPGÂ Â Â  |  JPEG image   
DGNÂ Â Â  |  MicroStation file  |  XLSX  |  Microsoft Excel spreadsheet  |  BMP  |  Bitmap image   
DWF  |  Autodesk file  |  XLS  |  Microsoft Excel spreadsheet  |  PNG  |  PNG image   
PDFÂ Â Â  |  Adobe Acrobat PDF  |  XLSM  |  Macro-enabled Microsoft Excel spreadsheet  |  GIF  |  GIF image   
XML  |  XML document  |  XLT  |  Microsoft Excel template  |  WMF  |  Windows Metafile image   
RTF  |  Rich Text Format document  |  PPTX  |  Microsoft PowerPointÂ presentation  |  MSG  |  Message file   
TXT  |  Text document  |  PPT  |  Microsoft PowerPoint presentation  |  HTML  |  HTML document   
VSD  |  Microsoft Visio drawing  |  PPS  |  Microsoft PowerPoint show  |  Â  |  Â   
  
  
Note  If the file type is .IFC and you have a BIM application installed,
FusionLive Viewer will open the BIM-type file in that application.Â

  1. To open a document in Viewer, select View from the Document Actions menu. 

Alternatively, you can click on a View button associated with a document list
or click on the glasses icon next to a documentâs title.

Note  If Rendition Security is enabled and you have the Native Users role,
select View Native to open the native document in the Viewer. Otherwise,
select View to view its rendition. If you do not have this role you cannot
select View Native. Under Rendition Security, markups can only be made on the
rendition. Therefore, View Native opens the Viewer in read-only mode.

Note  FusionLive documents can also be displayed by passing document
information directly via a URL. These documents are always read-only. For more
information, see the FusionLive Web Service Reference Guide.

  1. The Viewer opens in a pop-up window with the documentâs reference, title and version displayed at the top. 

![](../images/PDFTRON view markups.png)

  1. If you are not a Lead Reviewer, if you have not previously created a markup layer, a new layer is created, labeled with your name and the date and time. If you have previously created markups, your existing markups will be displayed instead. 

  1. If you are a Lead Reviewer, or Deliverables Activity administrator, you will see all markups, no markups or only the consolidated markup layer, as defined in the Review Markup Settings. 
  2. If the Lead Reviewer has previously added markups and the document is still under formal review, then all viewers will see the Lead Reviewer's most recent markup. 

Note  If the document contains existing markups that were created in the old
viewer, these will be automatically converted when it is opened.


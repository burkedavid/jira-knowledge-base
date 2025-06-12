Tag Extraction

Click here to see this page in full context

##  Tag Extraction

Tag extraction allows Tag Extractors to send documents to the FusionLive Tag
Extraction service to have their tag information converted into a form that is
compatible with FusionLive. This is done using a set of rules specific to the
documents in your workspace known as a configuration set (see [ Tag extraction
configuration ](Tag_extraction_configuration.htm#h) ).

Once the tags have been extracted they can be validated and added to the tag
register and automatically associated with the document.

The following file formats are supported for tag extraction.

File format  |  Description  |  File formatÂ Â  |  Description   
---|---|---|---  
DWG  |  AutoCAD drawingÂ  |  DOC/DOCXÂ Â  |  Microsoft Word document   
Note  Hotspots not available in Word documents  
DXF  |  AutoCAD data file  |  XLS/XLSX  |  Microsoft Excel spreadsheet   
Note  Hotspots not available in Excel documents  
PDF  |  Adobe Acrobat fileÂ Â  |  Â  |  Â   
  
Note  If the workspace has Rendition Security enabled, Native documents cannot
be sent for tag extraction. Send the PDF rendition instead.Â Â Â Â Â Â Â

Unsupported file types sent for extraction will not be processed.

  1. Select the documents you want to send for extraction.Â  Note  If you select a placeholder, the most recent version in the version stack will be used for extraction. 
  2. From the Document Actions menu, select Extract Tags. 

In the Documents page, the Tag Extraction column indicates whether a document
has been sent for extraction and the current status of the extraction process.

IconÂ Â Â  |  Extraction status   
---|---  
![](../images/ic_pending.png) |  Document has been sent for extraction and a response is pending.   
![](../images/ic_completed.png) |  Extraction completed.   
![](../images/ic_mute.png) |  Extraction completed but no tags were returned.   
![](../images/ic_failed.png) |  Extraction failed.   
  
Â  
If the tag extraction fails you will be notified by email of the reasons for
failure

Â


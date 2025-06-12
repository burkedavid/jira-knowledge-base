Downloading documents

Click here to see this page in full context

###  Downloading documents

FusionLive allows you to download documents onto your local file system,
providing you have the appropriate permissions to access them. To prevent
other users from editing a document while you are working on it, FusionLive
allows you to optionally check the document out for editing. You can also
check out CAD associations and attachments at the same time.

When CAD documents with associations are downloaded, FusionLive creates a ZIP
download package containing all of the child documents associated with the
selected document. The contents of the ZIP are presented in a flat, non-
hierarchical structure. Additionally, if, when downloading CAD drawings, a
child file is associated with two or more parent files, only one instance of
the child file will be downloaded.

  1. On the Documents page, select the documents you wish to download. 
  2. Press the Download button in the menu bar. Alternatively, click on the Title link for that document. 

The Download screen displays the documents you have selected to download. If
they contain attachments, references or merged hybrid files, those attachments
and associated documents are listed hierarchically.

Note  If you are a member of the Restricted Users role you will only be able
to download attachments of document types that are on the Unrestricted
Attachments list.

To remove a document from the download, select it and press the Remove button.

  1. The filename given to each saved file can comprise a combination of document metadata. Select the naming convention you want to apply from the drop-down menu: 

Naming convention  |  Description   
---|---  
Reference  |  Use the document reference for the downloaded filename.   
Title  |  Use the document title for the downloaded filename.   
Filename  |  Use the original filename for the downloaded filename.   
Filename with Title  |  Combine the original filename and title to make the downloaded filename.   
Reference with Title  |  Combine the reference and title to make the downloaded filename.   
Client Reference Number  |  Use the clientâs reference number for the downloaded filename.   
  
Â Â Â  
Note  When the Business Rules module is enabled, the naming convention
defaults to Filename. In non-Business Rules workspaces the default setting is
Reference.Â

You can add the revision of the document to the end of the saved file name by
checking the Append Revision box or add the status of the document by checking
the Append Status box. If neither are selected, or if the values are not
populated, nothing will be added to the filename. If you change the appended
part of a filename (for example, a revision part from _A to _B), when you
upload the document again the relevant metadata value will be updated
automatically.

Note  In Deliverables Management workspaces Append Status is replaced by
Reason For Issue.

Note  If you change the filename, this may affect FusionLiveâs ability to
find a match during the upload process.

  1. If Rendition Security is enabled and you have the Native Users role, select whether to download the Native Documents or Rendition Documents from the drop-down menu. If you do not have this role, you can only download renditions. 
  2. Select whether to download only the parent documents, only their attachments, or both. 

Option  |  Description   
---|---  
Downloads and Attachments  |  The parent documents will be downloaded with their attachments.   
Downloads only  |  Only the parent documents will be downloaded.   
Attachments only  |  Only the attachments will be downloaded.   
  
  

  1. Checking out the documents selected for download ensures that no revisions can be made by other users while you are working on them. Note Check-out is not available in Inbox workspaces. 

To check out only the main documents selected for download, select the Check
out top-level documents box at the bottom of the screen.

If some of the documents selected for download are CAD drawings, they may also
have associated documents that you will also need to download. Select the
Check out CAD associations box.

Note  If any associated documents were merged with the CAD parent during
upload, they will not be displayed in FusionLive but will be shown as merged
files when you download the parent and cannot be downloaded individually.

If the documents selected for download have attachments, these will be shown
in the Download screen and will be downloaded along with the main documents.
To check the attachments out as well as the main documents, select the Check
out attachments box.

  1. Before you can check out and download the selected documents, FusionLive validates whether you are permitted to do so. The Check Out? column indicates this with an icon. 

Icon  |  Description   
---|---  
![](../images/download_checkout.png) |  Document will be checked out.   
![](../images/download_warning.png) |  Document cannot be downloaded. This may be because it was deleted, you do not have access to its workspace folder or you do not have access to its lifecycle status.   
![](../images/download_soft_deleted.png) |  Document cannot be checked out because it was deleted.   
![](../images/download_read_only.png) |  You can view this document but not check it out. This may be because you only have Viewer access to the folder or workspace.   
![](../images/Is-link.gif) |  Document cannot be checked out because it is a link.   
![](../images/download_not_latest_version.png) |  Document cannot be checked out because it is not the latest version.   
![](../images/download_checked_out_me.png) |  Document is already checked out by you.   
![](../images/download_checked_out_other.png) |  Document cannot be checked out because it is checked out by another user.   
![](../images/download_doc_locked_me.png) |  Document cannot be checked out because it is locked by you.   
![](../images/download_doc_locked_other.png) |  Document cannot be checked out because it is locked by another user.   
  
  

  1. From the Download as drop-down menu select whether to download the files individually or in a ZIP package.Â 

Note  The default option is set in your ZIP download process preference (see [
Preferences ](../User_Settings/Preferences.htm#h) ).

Note  CAD files with references must be downloaded as a ZIP file.

  1. Press Download to download and check out the selected files 

Â


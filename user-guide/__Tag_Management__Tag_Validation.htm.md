Tag Validation

Click here to see this page in full context

##  Tag Validation

Once the tags contained in a document have been extracted, they need to be
validated by a Tag Manager. Depending on the Automatic Validation setting (see
[ Tag configuration ](../Admin/Workspace_Settings/Tag_configuration.htm#h) ),
all of the tags or some of them (for example, in spec tags or only tags that
already exist in the tag register) may be validated automatically on
extraction. Tags that are not automatically validated (or all tags if
Automatic Validation is not enabled) will be given the Pending validation
status and must be validated manually in the Viewer.

If the document is required to undergo formal review, the tag validation is
usually done as part of that review. If a new version of the document needs to
be resubmitted as a result of the review, it must be sent for extraction
again. Tags which have already been validated in a previous version will
automatically be validated in the new version, but tags which were previously
rejected will return to the Pending validation status and must be validated
manually again.Â

Tag validation is done using the Viewer.

If the new viewer has been enabled for the workspace see XXXXXXX.

###  Validate tags

When a document containing tags has completed extraction, any unvalidated tags
will be in the Pending status. Tag Managers can open the document in Viewer
and validate or reject the tags.

  1. Locate the document containing extracted tags and double click to open the Document Info page.Â 
  2. From the Document Info menu, select Tag Details. Review the list of tags. If there are any in the Pending status, you will need to validate them. 
  3. Select the latest version of the document and press View to open the document in Viewer. 
  4. In Viewer, if the tags information is not displayed select Tags in the menu bar. 

![](../images/brava tags screen.png)

  1. When a document contains tags, to the left of the document itself, Viewer displays a tag list containing the tags that are contained in the document. The number of tags that have been validated or rejected out of the total number of tags in the document are displayed in the title bar. 

![](../images/brava tags title bar.png)

  1. The tag list has two tabs. The Current Version tab shows the tags contained in the current version of the document. This is the tab you will be working with when validating tags.Â 

Clicking on the Previous Version tab will show the tags contained in the
previous version of the document that are not in the current version (for
example, if the tag was removed from the drawing). To open that document in a
separate instance of Viewer, click on one of the tag numbers In the Previous
version tab.

  1. By default the hotspot layer is visible. To hide the hotspot layer, click on the Hide Hotspots icon. To view the tag layer again, click on the Show Hotspots icon. 
  2. The tag list is organized by tag classification. Each classification displays the number of tags associated with it. 

If you do not need to see the tags associated with a classification, click on
the arrow icon to the right of the classification to collapse it. Click on the
arrow again to expand the classification.

  1. To locate a specific tag number in the tag list, enter some or all of the tag number in the Filter box. 
  2. To view the metadata for a tag, click on its blue information icon. Close the information window when you are finished. 
  3. Each tag number displays the number of hotspot instances of that tag that exist in the document. The color of the tag number indicates its validation status. 

Tag number color  |  Validation status   
---|---  
Black  |  Pending   
Green  |  Validated (â)   
Red  |  Rejected (X)   
  
Â

  1. A yellow triangle icon indicates that a tag has been superseded and cannot be validated. 
  2. A black triangle icon indicates that a tag has changed in some way. This may occur if the tag has been superseded or changed to a status that does not allow associations, or a change may have occurred during the extraction process (for example, if an O was changed to a 0). Alternatively, the icon may indicate that a comment was created when the tag was added.Â 

![](../images/black triangle.png)

Hover over the icon to view the relevant information.

  1. To validate a pending tag, click on its tag number in the tag list. The display will zoom to the first hotspot and it will flash briefly. 

The Tag Review bar at the bottom displays information about the selected tag
number.

![](../images/tag review bar.png)

Tag Information  |  Description   
---|---  
Color  |  The color of the bar indicates the validation status:   
Yellow  \- Pending  
Green  \- Validated  
Red  \- Rejected  
The bounding box of the hotspot matches the Tag Review bar.  
Tag Number  |  The tag number of the selected tag.   
Classification  |  The classification of the selected tag.   
Type  |  The type of the selected tag.   
Registered  |  Indicates whether the tag exists in the tag register. If unregistered, when you validate the tag it will be added to the register.   
Validation status  |  The validation status of the selected tag (Pending, Validated or Rejected).   
In specÂ  |  Whether the tag is In spec or Out of spec.   
Number of instances  |  Indicates which instance of the tag is selected out of the total number of instances in the document. Click on the left arrow button to move to the previous instance or the right arrow button to move to the next instance.   
  
Â Â Â  
Note  If the selected tag is in a status that does not allow document
associations you will not be able to validate it.

To validate the selected pending tag, click on the tick icon in the Tag Review
bar. The review bar and hotspot turn green, the tick icon is circled and the
validation status changes to Validated.

To reject the selected pending tag, click on the cross icon in the Tag Review
bar. The review bar and hotspot turn red, the cross icon is circled and the
validation status changes to Rejected.

  1. Use the same method to change the status of a validated or rejected tag either to the opposite value or back to pending.Â 

Action  |  Description   
---|---  
Reject a validated tag  |  Select the tag and click on the cross icon in the review bar.   
Return a validated tag to pending  |  Select the tag and click on the circled tick icon in the review bar.   
Validate a rejected tag  |  Select the tag and click on the tick icon in the review bar.   
Return a rejected tag to pending  |  Select the tag and click on the circled cross icon in the review bar.   
  
Â

  1. Add a Viewer markup to explain the reason for rejected tags, if required. 
  2. The next Pending tag in the tag list will be selected automatically. You can use the up and down arrows in the Tag Review bar to select previous and subsequent tags. 

Alternatively, select another pending tag number in the tag list directly.

  1. When the tags are all validated or rejected, save your markups and close the viewer.Â 


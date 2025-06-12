Change Tag Status

Click here to see this page in full context

##  Change Tag Status

You can manually change the status of a tag to one of the other tag statuses
created for your workspace.

  1. In the Tag Register screen, select one or more tags. 
  2. From the Change Status menu, select the new status for these tags.  Note  You can only select statuses of types that are valid in relation the current status. 

The status type chosen will affect the behavior of the tags.Â Â Â Â Â Â Â Â Â

StatusÂ Â Â  |  Description   
---|---  
Active  |  Tag records of any status type can be changed to an active status type. Active status types (if Allow Associations is enabled for that status type) allow associations to be made to documents, POs and other tags.Â   
Inactive status type (for example, Retired or Void)Â Â  |  Any document, PO or tag associations will be retained but no more associations can be made.Â   
Inactive tags can be reinstated by changing the status again to an active
status.  
Superseded  |  Tag Managers can supersede existing tags with replacement tags (for example, if the tagging standard used in a project is updated). In a supersede action, you can select one or more tags to be superseded by a single replacement tag.Â   
When you supersede a tag, its document and tag associations are transferred to
the replacement tag. If the Carry forward on supersede box is checked in the
Tag Configuration page, purchase orders will also be transferred to the
replacement tag.  
The status of the original tags change to Superseded and an association is
created identifying the selected tag as a Replacement of the existing ones.
The document and tag associations of the replacement tag are the sums of the
superseded ones.Â  
Note  Only the associations with the latest version of a document are carried
forward to the replacement tag. Historic associations to older versions are
not carried forward.Â  
Note  In the scenario where both existing tag and replacement have parent
associations, the parent association of the superseded tag is not carried
forward to the replacement.Â  
Note  You can only supersede tags with an Active status type.  
Deleted  |  Any document, PO or tag associations will be retained and displayed in gray in the Tag Register. However, no more associations can be made.Â   
If a tag with no associations is changed to the Deleted status it is deleted
permanently from the workspace.  
Deleted tags can be reinstated by changing the status again to an active
status.  
  
Â

The new status will be displayed in the Tag Register.


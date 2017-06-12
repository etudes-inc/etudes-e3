    function scrollHelper(e, tr)
	{
		var $originals = tr.children();
		var $helper = tr.clone();
		$helper.children().each(function(index)
		{
			$(this).width($originals.eq(index).width());	
		});
		return $helper;
	};
	
	 jQuery(document).ready(function(){			
		 var len = $('.addDndImage').length;
		
		 if ($('#saveDndTop')[0] && (len > 14))
			 {					 
				$('#saveDndTop').append('<input id="reOrderBtnTop" type="submit" value="Save" class="dndBottomImgSave">'); // Create the element			
			 }
			// Configure saveDnd div element
		 if ($('#saveDnd')[0])
			 {
				$('#saveDnd').append('<input id="oldPosition" name="oldPosition" type="hidden" />'); // Create the element
				$('#saveDnd').append('<input id="newPosition" name="newPosition" type="hidden" />'); // Create the element
				$('#saveDnd').append('<input id="newOrderToSend" name="newOrderToSend" type="hidden" />'); // Create the element
				$('#saveDnd').append('<input id="reOrderBtn" type="submit" value="Save" class="dndBottomImgSave">'); // Create the element
			 }
			 // Configure saveReturnDnd div element
		 if ($('#saveReturnDnd')[0])
			 {
				$('#saveReturnDnd').append('<input id="oldPosition" name="oldPosition" type="hidden" />'); // Create the element
				$('#saveReturnDnd').append('<input id="newPosition" name="newPosition" type="hidden" />'); // Create the element
				$('#saveReturnDnd').append('<input id="newOrderChatToSend" name="newOrderChatToSend" type="hidden" />'); // Create the element
				$('#saveReturnDnd').append('<input id="returnBtn" type="submit" value="Return" class="dndBottomImgReturn">'); // Create the element
				$('#saveReturnDnd').append('<span class="ambrosiaDivider"></span>'); // Create the element
				$('#saveReturnDnd').append('<input id="reOrderBtn" type="submit" value="Save" class="dndBottomImgChatSave">'); // Create the element
				
			 }
		 
		//submit the form on click of save button
		 if ($('.dndBottomImgSave')[0])
			 {
				$('.dndBottomImgSave').click(function (e) {
					 $("#sakai_action").val("savePositions");
                      $(this).parents('form').submit();
				}); 
			 }
			 
		//submit the form on click of save button
		 if ($('.dndBottomImgChatSave')[0])
			 {
				$('.dndBottomImgChatSave').click(function (e) {
					 $("#sakai_action").val("savePositions");
				}); 
			 }	 
			 
		if ($('.dndBottomImgReturn')[0])
			 {
				$('.dndBottomImgReturn').click(function (e) {
					 $("#sakai_action").val("doCancel");
				}); 
			 }	 
		 
			// add icon and combo box to the div element containing reorderGrp as id
		 	if ($('.addDndImage')[0])
		 		{
				 $("[id*='reorderGrp']").each(function(index, value){	
					$(this).append("<img src='/e3/support/icons/reorder.png' />"); 
					
					if ( $('#checkSortOption')[0] && ($('#checkSortOption').val() != "position")) 
						{
						// no combo box
						}
					else
						{
							var idx = index+1;
							var selectId = 'reorderCombo' + index;
							var newSelect = $("<select id='" + selectId + "' name='" + selectId + "' class='dndCombo'/>");
							value.element = newSelect;
							$(this).append(newSelect);
							var options = '';
						     for (var i = 1; i <= len; i++) {
						    	 if (i == idx)
						    		 options += '<option value="' + i+ '" selected>' + i + '</option>';
						    	 else	 
						    		 options += '<option value="' + i+ '">' + i + '</option>';
						      }
						    newSelect.html(options);
						    var theValue = $(newSelect).val();
				            $(newSelect).data("value", theValue);	            
						    $(newSelect).change(function(){
							    var previousValue = $(this).data("value");
					            var theValue = $(this).val();
					      
					            $("[id$='oldPosition']").val(previousValue);
						        $("[id$='newPosition']").val(theValue);	
						        
						        var orderVals = [];
								$("div[id*='itemId']").each(function(index, value){	
									orderVals[index] = $(this).html();
								});
								$("#newOrderToSend").val(orderVals.join(","));	        
								$("#newOrderChatToSend").val(orderVals.join("%"));        
						        
					            $(this).data("value", theValue);  
					            
					            if ( $('#sakai_action')[0] ) { 
									  $("#sakai_action").val("sortToNewPositions");
									  $(this).parents('form').submit();	
								 }
								 if ( $('#syllEditForm\\:reOrderSyllabusComboButton')[0] ) { 
									  $("#syllEditForm\\:reOrderSyllabusComboButton").trigger("click");
								  }
						    });
						}
				 });		
			
			// if icon selected for reordering remove the combo box
			$('.dndImage').click(function (e) {
			    $(".dndCombo").remove();
			});
	   }
	
		if ( $('#reOrderItems')[0] && ($('#checkOption2').val() == "false")) { 
			$("#reOrderItems tbody").sortable({axis: 'y', containment:'parent', distance:4, tolerance:'pointer', scrollSensitivity: 20,
				sort: function(event, ui){
					$(".dndCombo").remove();
				},
				stop: function(event, ui) {	
				var orderVals = [];
				$("div[id*='itemId']").each(function(index, value){	
					orderVals[index] = $(this).html();
				});
				$("#newOrderToSend").val(orderVals.join(","));
			}});	
		}
		
		if ( $('#reOrderChatItems')[0] && ($('#checkOption2').val() == "false")) { 
			$("#reOrderChatItems tbody").sortable({axis: 'y', containment:'parent', distance:4, tolerance:'pointer', scrollSensitivity: 20,
				sort: function(event, ui){
					$(".dndCombo").remove();
				},
				stop: function(event, ui) {	
				var orderVals = [];
				$("div[id*='itemId']").each(function(index, value){	
					orderVals[index] = $(this).html();
				});
				$("#newOrderChatToSend").val(orderVals.join("%"));
			}});	
		}
		
		if ( $('#syllEditForm\\:syllItems')[0] ) { 
			$("#syllEditForm\\:syllItems tbody").sortable({axis: 'y', containment:'parent', distance:4, tolerance:'pointer', scrollSensitivity: 20,
				sort: function(event, ui){
					$(".dndCombo").remove();
				},
				stop: function(event, ui) {			
				var order = $("[id$='itemId']").text();
				$("#syllEditForm\\:newOrderToSend").val(order);		
				}});			
		}
});	

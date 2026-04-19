-- Allow either party in a friendship to delete it (remove friend, cancel request, or decline request)
CREATE POLICY "friendships_delete" ON public.friendships FOR DELETE
  USING (auth.uid() IN (requester_id, addressee_id));
  
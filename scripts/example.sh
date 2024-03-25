readarray -d '' examples < <(ls ./examples)

found=0

for item in ${examples[@]}; do
  if [[ "$item" == "$1" ]]; then
    found=1
    break
  fi
done

if [[ $found -eq 1 ]]; then
  cd ./examples/$1
  bunx remedy
else
  echo "Choose from:"
  echo
  echo "$examples"
fi
